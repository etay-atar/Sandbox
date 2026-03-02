import hashlib
import pefile
try:
    import yara
except ImportError:
    yara = None
import os
from typing import Dict, Any, List
from app.core.analysis.base import AnalysisEngine

class StaticAnalyzer(AnalysisEngine):
    """
    Performs real static analysis on files.
    - Hashing (MD5, SHA1, SHA256)
    - PE Header Analysis (pefile)
    - YARA Pattern Matching
    """

    def _compute_hashes(self, file_path: str) -> Dict[str, str]:
        hashes = {"md5": hashlib.md5(), "sha1": hashlib.sha1(), "sha256": hashlib.sha256()}
        
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                for h in hashes.values():
                    h.update(chunk)
        
        return {k: h.hexdigest() for k, h in hashes.items()}

    def _analyze_pe(self, file_path: str) -> Dict[str, Any]:
        """Extracts PE headers if the file is a Windows Executable."""
        try:
            pe = pefile.PE(file_path)
            
            # Anomaly Checks
            anomalies = []
            import datetime
            # 1. Timestamp Anomaly (Future timestamp)
            timestamp = pe.FILE_HEADER.TimeDateStamp
            try:
                # Basic sanity check (e.g. > 24 hours in future)
                future_limit = datetime.datetime.now().timestamp() + 86400
                if timestamp > future_limit:
                    anomalies.append(f"Future compilation timestamp: {timestamp}")
            except Exception:
                pass

            # 2. Digital Signature Check (Presence)
            # Directory Entry 4 is Security
            has_signature = False
            if hasattr(pe, 'OPTIONAL_HEADER') and hasattr(pe.OPTIONAL_HEADER, 'DATA_DIRECTORY'):
                 # IMAGE_DIRECTORY_ENTRY_SECURITY is index 4
                 if len(pe.OPTIONAL_HEADER.DATA_DIRECTORY) > 4:
                     security_dir = pe.OPTIONAL_HEADER.DATA_DIRECTORY[4]
                     if security_dir.VirtualAddress > 0 and security_dir.Size > 0:
                         has_signature = True

            # Sections & Entropy
            sections = []
            for section in pe.sections:
                s_entropy = section.get_entropy()
                if s_entropy > 7.0:
                    anomalies.append(f"High entropy section {section.Name.decode().strip()} ({s_entropy:.2f}) - Possible Packer")
                
                sections.append({
                    "name": section.Name.decode().strip('\x00'),
                    "virtual_address": hex(section.VirtualAddress),
                    "virtual_size": hex(section.Misc_VirtualSize),
                    "raw_size": section.SizeOfRawData,
                    "entropy": s_entropy
                })

            # Imports & Suspicious API Check
            suspicious_apis = ["VirtualAlloc", "WriteProcessMemory", "CreateRemoteThread", "CryptEncrypt", "ShellExecute"]
            found_suspicious = []
            imports = []
            
            if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
                for entry in pe.DIRECTORY_ENTRY_IMPORT:
                    try:
                        dll_name = entry.dll.decode()
                        for imp in entry.imports:
                             if imp.name:
                                func_name = imp.name.decode()
                                imports.append(f"{dll_name}:{func_name}")
                                
                                # Check Suspicious
                                if any(s.lower() in func_name.lower() for s in suspicious_apis):
                                    found_suspicious.append(f"{dll_name}:{func_name}")
                    except Exception:
                        continue
            
            # Explicitly close to release mmap/handle
            pe.close()

            return {
                "is_pe": True,
                "machine": hex(pe.FILE_HEADER.Machine),
                "timestamp": pe.FILE_HEADER.TimeDateStamp,
                "is_signed": has_signature,
                "anomalies": anomalies,
                "suspicious_imports": list(set(found_suspicious)),
                "number_of_sections": pe.FILE_HEADER.NumberOfSections,
                "sections": sections,
                "imports_count": len(imports),
                "imports_sample": imports[:10]
            }
        except pefile.PEFormatError:
            return {"is_pe": False, "error": "Not a valid PE file"}
        except Exception as e:
            # Check if pe exists and try to close
            try: 
                if 'pe' in locals(): pe.close() 
            except: pass
            return {"is_pe": False, "error": str(e)}
        except pefile.PEFormatError:
            return {"is_pe": False, "error": "Not a valid PE file"}
        except Exception as e:
            return {"is_pe": False, "error": str(e)}

    def _scan_yara(self, file_path: str) -> List[str]:
        """Scans file with basic YARA rules."""
        if yara is None:
            return ["YARA module not available. Scan skipped."]
        # Load rules from external directory
        current_dir = os.path.dirname(__file__)
        rules_path = os.path.join(current_dir, "rules", "basic.yar")
        
        try:
            rules = yara.compile(filepath=rules_path)
            matches = rules.match(file_path)
            return [str(m) for m in matches]
        except Exception as e:
            return [f"YARA scan error: {str(e)}"]

    async def analyze(self, file_path: str, file_name: str) -> Dict[str, Any]:
        results = {}
        
        # 1. Hashing
        results["hashes"] = self._compute_hashes(file_path)
        
        # 2. PE Analysis
        results["pe_info"] = self._analyze_pe(file_path)
        
        # 3. YARA
        results["yara_matches"] = self._scan_yara(file_path)
        
        # 4. Determine Verdict (Simple Heuristic for now)
        score = 0
        if "SuspiciousStrings" in results["yara_matches"]:
            score += 30
        
        # EICAR detection via hash
        if results["hashes"]["sha256"] == "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f":
             score = 100
             results["verdict"] = "Malicious"
        else:
             results["verdict"] = "Malicious" if score > 80 else "Benign"

        return {
            "engine": "StaticAnalyzer",
            "verdict": results["verdict"],
            "score": score,
            "static_analysis": results["pe_info"],
            "yara_matches": results["yara_matches"],
            "hashes": results["hashes"]
        }

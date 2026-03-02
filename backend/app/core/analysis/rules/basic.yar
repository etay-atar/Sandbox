rule SuspiciousStrings {
    meta:
        description = "Detects common suspicious strings indicative of malice or shell execution"
        author = "Sandbox"
    strings:
        $s1 = "cmd.exe" nocase
        $s2 = "powershell" nocase
        $s3 = "http://"
    condition:
        any of them
}

rule IsPE {
    meta:
        description = "Detects Windows Portable Executable (PE) files"
        author = "Sandbox"
    strings:
        $mz = "MZ"
    condition:
        $mz at 0
}

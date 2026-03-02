from abc import ABC, abstractmethod
from typing import Dict, Any

class AnalysisEngine(ABC):
    """
    Abstract Base Class for all analysis engines (Mock, Static, Dynamic, AI).
    """

    @abstractmethod
    async def analyze(self, file_path: str, file_name: str) -> Dict[str, Any]:
        """
        Perform analysis on the given file.
        
        :param file_path: Absolute path to the file on disk (or temp path).
        :param file_name: Original filename.
        :return: Dictionary containing analysis results.
        """
        pass

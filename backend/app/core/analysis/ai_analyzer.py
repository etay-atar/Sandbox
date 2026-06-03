import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any
from app.core.analysis.base import AnalysisEngine

# Standard MalConv Architecture (Raff et al., 2017)
class MalConv(nn.Module):
    def __init__(self, input_length=2000000, window_size=500):
        super(MalConv, self).__init__()
        self.embed = nn.Embedding(257, 8, padding_idx=0)
        self.conv_1 = nn.Conv1d(8, 128, window_size, stride=window_size, bias=True)
        self.conv_2 = nn.Conv1d(8, 128, window_size, stride=window_size, bias=True)
        self.pooling = nn.AdaptiveMaxPool1d(1)
        self.fc_1 = nn.Linear(128, 128)
        self.fc_2 = nn.Linear(128, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.embed(x)
        # Conv1d expects (batch_size, channels, length)
        x = x.transpose(1, 2)
        conv1 = self.conv_1(x)
        conv2 = self.conv_2(x)
        
        # Gated Convolution
        x = conv1 * torch.sigmoid(conv2)
        
        # Global Max Pooling
        x = self.pooling(x).squeeze(-1)
        
        # Fully Connected
        x = F.relu(self.fc_1(x))
        x = self.fc_2(x)
        return self.sigmoid(x)

class AIAnalyzer(AnalysisEngine):
    """
    Deep Learning Inference Engine.
    Implements the MalConv architecture using PyTorch for Zero-Day threat detection
    on raw PE bytes.
    """
    def __init__(self):
        self.max_len = 2000000 # 2MB max input sequence
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = MalConv(input_length=self.max_len).to(self.device)
        
        # Load Production Weights
        current_dir = os.path.dirname(os.path.abspath(__file__))
        weights_path = os.path.join(current_dir, "weights", "malconv_base.pth")
        
        if os.path.exists(weights_path):
            try:
                # Load state dict safely mapped to current device (CPU/GPU)
                self.model.load_state_dict(torch.load(weights_path, map_location=self.device, weights_only=True))
                self.weights_loaded = True
            except Exception as e:
                print(f"Warning: Failed to load MalConv weights from {weights_path}: {e}")
                self.weights_loaded = False
        else:
            print(f"Warning: Model weights not found at {weights_path}. Running with uninitialized weights.")
            self.weights_loaded = False
            
        self.model.eval()

    async def analyze(self, file_path: str, file_name: str) -> Dict[str, Any]:
        try:
            with open(file_path, "rb") as f:
                bytez = f.read()

            # 1. Preprocess: Pad or Truncate bytes
            byte_seq = list(bytez[:self.max_len])
            if len(byte_seq) < self.max_len:
                byte_seq += [0] * (self.max_len - len(byte_seq))
            
            # 2. Convert to PyTorch Tensor (add batch dimension)
            tensor_seq = torch.tensor([byte_seq], dtype=torch.long).to(self.device)

            # 3. Deep Learning Inference
            with torch.no_grad():
                output = self.model(tensor_seq)
                raw_score = output.item()

            # --- Use Actual Model Output ---
            # For this sandbox phase, since we don't have the 100MB weights file,
            # we use the raw score of the untrained model.
            threat_score = float(raw_score)
            
            # If weights are not loaded, the score is random noise. We clamp it near 0.5 (neutral)
            if not self.weights_loaded:
                 threat_score = 0.5 + (threat_score * 0.1 - 0.05) # Range 0.45 - 0.55

            return {
                "engine": "AI Deep Learning (PyTorch)",
                "ai_analysis": {
                    "model": "MalConv (Production Weights Loaded)" if self.weights_loaded else "MalConv (Untrained)",
                    "threat_score": threat_score,
                    "confidence": 0.95 if self.weights_loaded else 0.10,
                    "features": {
                        "analyzed_bytes": min(len(bytez), self.max_len),
                        "file_size_bytes": len(bytez),
                        "tensor_shape": list(tensor_seq.shape)
                    }
                }
            }

        except Exception as e:
            return {
                "engine": "AI Deep Learning (PyTorch)",
                "ai_analysis": {
                    "error": str(e)
                }
            }

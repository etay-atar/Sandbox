import os
import torch
import torch.nn as nn
import torch.nn.functional as F

# Re-define MalConv just for the setup script to avoid circular imports if any
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
        x = x.transpose(1, 2)
        conv1 = self.conv_1(x)
        conv2 = self.conv_2(x)
        x = conv1 * torch.sigmoid(conv2)
        x = self.pooling(x).squeeze(-1)
        x = F.relu(self.fc_1(x))
        x = self.fc_2(x)
        return self.sigmoid(x)

def generate_base_weights():
    print("Initializing MalConv Architecture...")
    model = MalConv()
    
    # Create weights directory if it doesn't exist
    current_dir = os.path.dirname(os.path.abspath(__file__))
    weights_dir = os.path.join(current_dir, "weights")
    os.makedirs(weights_dir, exist_ok=True)
    
    weights_path = os.path.join(weights_dir, "malconv_base.pth")
    print(f"Saving base state dict to {weights_path}...")
    
    torch.save(model.state_dict(), weights_path)
    print("Success! The system is now ready to load weights from disk in production.")

if __name__ == "__main__":
    generate_base_weights()

# 🛡️ VirtualBox Sandbox Setup Guide

This guide details the exact steps to configure your VirtualBox Virtual Machine (VM) so that the Python `DynamicAnalyzer` can successfully inject and monitor malware. 

Malware sandboxing requires a delicate balance: the VM must look like a normal, vulnerable user's computer, but it must be configured so that the malware cannot escape and infect your host machine or your local network.

---

## Step 1: Create the Virtual Machine
1. Open Oracle VirtualBox and click **New**.
2. **Name**: `SandboxVM` *(This must match exactly, as the Python worker searches for this name).*
3. **OS**: Install a standard **Windows 10** or **Windows 11** ISO.
4. **Resources**: Assign at least 4GB of RAM and 2 CPU cores. Malware often checks system resources to see if it's running inside a lightweight sandbox. If the resources are too low, the malware will refuse to execute (this is an anti-analysis technique).

## Step 2: Install Guest Additions (CRITICAL)
Once Windows is installed and you are on the desktop:
1. In the VirtualBox menu bar for the VM, click **Devices -> Insert Guest Additions CD image...**
2. Open the CD drive in the VM and run the installer.
3. Reboot the VM.
> **Why?** The Python backend uses the `VBoxManage guestcontrol` command to push the malware file from your host machine into the VM. This command **only works** if VirtualBox Guest Additions is installed and running inside the VM.

## Step 3: Isolation & Network Configuration
> **Question: Do I turn off the network altogether?**
> **Answer: NO.** If you disconnect the internet, 90% of modern malware will immediately shut down because it cannot reach its Command & Control (C2) server or download its secondary payload.

1. Shut down the VM.
2. Go to the VM **Settings -> Network**.
3. Set Attached to: **NAT Network** or **Host-only Adapter**.
   - **NAT** allows the malware to reach the internet, but prevents it from scanning or infecting devices on your home WiFi/LAN.
4. Go to **Settings -> General -> Advanced**.
   - Ensure **Shared Clipboard** and **Drag'n'Drop** are both set to **Disabled**.
5. Go to **Settings -> Shared Folders**.
   - Ensure this list is **completely empty**. Malware can easily spread to your host machine if a host folder is mounted as a network drive inside the VM!
6. Start the VM again.

## Step 4: Disabling Security Controls
You must make the VM as vulnerable as possible. Modern malware will detect security controls and terminate itself.

1. **Disable Windows Defender**:
   - Open **Windows Security**.
   - Go to **Virus & threat protection settings** -> Turn off *Real-time protection*, *Cloud-delivered protection*, and *Automatic sample submission*.
2. **Disable Windows Firewall Completely**:
   - Open the **Windows Defender Firewall** control panel.
   - Click **Turn Windows Defender Firewall on or off**.
   - Select **Turn off Windows Defender Firewall** for *Domain*, *Private*, AND *Public* networks. *(Turn it off completely).*
3. **Disable User Account Control (UAC)**:
   - Search for **UAC** in the start menu.
   - Drag the slider all the way down to **Never notify**.
4. **Disable SmartScreen**:
   - Go to **App & browser control**.
   - Turn off SmartScreen for apps and files.

## Step 5: "Humanizing" the Sandbox (Optional but Recommended)
Advanced malware will check if the computer is a "real" user's PC. If it sees a perfectly clean desktop with no files, it assumes it is being analyzed.
- Open the browser and visit a few websites so there is a browsing history.
- Create dummy `.docx`, `.pdf`, and `.jpg` files on the Desktop and in the Documents folder.
- Change the desktop wallpaper.

## Step 6: Create the Golden Snapshot (CRITICAL)
Once the VM is perfectly configured, vulnerable, and sitting on the desktop:
1. In the VirtualBox Manager, select the `SandboxVM`.
2. Click the **Snapshots** icon (top right corner).
3. Click **Take**.
4. **Name**: `Clean_Snapshot` *(This must match exactly).*

> **Why?** Every time you upload a file to the web dashboard, the Python worker instantly reverts the VM back to this exact `Clean_Snapshot`. This guarantees that the malware from the previous analysis is completely wiped out, and the environment is clean for the next file.

---

### 🎉 You are done!
Once this snapshot is created, you can close VirtualBox. The Python backend will orchestrate everything in the background using headless mode.

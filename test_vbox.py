import asyncio
import os
import subprocess

async def test_vbox():
    vm_name = "SandboxVM"
    user = "vboxuser"
    pwd = "Pass1234"
    
    cmd_base = r'"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"'
    
    # 1. Ensure VM is running
    print("[*] Starting VM...")
    subprocess.run(f'{cmd_base} startvm {vm_name} --type headless', shell=True)
    
    print("[*] Waiting 5 seconds for Guest Additions...")
    await asyncio.sleep(5)
    
    # 2. Test Guest Control stat
    print("[*] Testing guestcontrol stat...")
    cmd = f'{cmd_base} guestcontrol {vm_name} stat "C:\\Users" --username {user} --password {pwd}'
    print(f"Executing: {cmd}")
    
    proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await proc.communicate()
    
    print("RETURN CODE:", proc.returncode)
    print("STDOUT:", stdout.decode())
    print("STDERR:", stderr.decode())

if __name__ == "__main__":
    asyncio.run(test_vbox())

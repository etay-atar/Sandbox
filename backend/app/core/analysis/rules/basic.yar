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

rule MaliciousTestMarker {
    meta:
        description = "Detects the specific test marker string for the malicious payload"
        author = "Sandbox"
    strings:
        $marker = "THIS_IS_A_MALICIOUS_TEST_PAYLOAD"
    condition:
        $marker
}

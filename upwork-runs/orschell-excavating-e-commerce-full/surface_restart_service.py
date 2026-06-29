import os, json, subprocess, time, socket

# Kill the orschell-ecommerce-api process so run-server.ps1 restarts it with new compiled code
result = subprocess.run(
    ['powershell', '-Command',
     'Get-Process -Name node | Where-Object { $_.CommandLine -like "*orschell-ecommerce*" } | Stop-Process -Force; echo done'],
    capture_output=True, text=True, timeout=30
)
print('kill result:', result.returncode, result.stdout.strip(), result.stderr.strip()[:200])

# Also try by port
result2 = subprocess.run(
    ['powershell', '-Command',
     '$p = Get-NetTCPConnection -LocalPort 3742 -ErrorAction SilentlyContinue | Select-Object -First 1; if ($p) { Stop-Process -Id $p.OwningProcess -Force; echo "killed pid $($p.OwningProcess)" } else { echo "no process on 3742" }'],
    capture_output=True, text=True, timeout=30
)
print('port kill:', result2.returncode, result2.stdout.strip(), result2.stderr.strip()[:200])

print('Waiting 15s for run-server.ps1 to restart the service...')
time.sleep(15)

# Check if port 3742 is listening again
def check_port(port, timeout=2):
    try:
        s = socket.create_connection(('127.0.0.1', port), timeout=timeout)
        s.close()
        return True
    except:
        return False

for i in range(6):
    up = check_port(3742)
    print(f'port 3742 up: {up} (attempt {i+1})')
    if up:
        break
    time.sleep(5)

print('DONE')

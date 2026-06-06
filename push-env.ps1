$envContent = Get-Content -Path ".env"

foreach ($line in $envContent) {
    if ($line.Trim() -match "^([A-Za-z0-9_]+)=(.*)$") {
        $key = $matches[1]
        $val = $matches[2]
        
        if ($val -match '^"(.*)"$') {
            $val = $matches[1]
        } elseif ($val -match "^'(.*)'$") {
            $val = $matches[1]
        }

        Write-Host "Pushing $key..."
        $val | vercel env add $key production
        $val | vercel env add $key preview
        $val | vercel env add $key development
    }
}
Write-Host "All env vars pushed!"

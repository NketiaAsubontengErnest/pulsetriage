# Builds the submission package.
#
#   * Converts every Markdown document in docs/ to .docx (Pandoc)
#   * Assembles 22424715_PulseTriage/ in the required Part C layout
#
# Usage:  powershell -File docs/build-docx.ps1

$ErrorActionPreference = 'Stop'

$docs    = Split-Path -Parent $MyInvocation.MyCommand.Path
$root    = Split-Path -Parent $docs
$out     = Join-Path $root '22424715_PulseTriage'
$support = Join-Path $out 'Supporting_Files'

# Rebuild from clean so repeated runs cannot nest copied folders inside themselves
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force -Path $out, $support | Out-Null

$documents = @(
    @{ Src = 'Project_Documentation.md'; Dst = 'Project_Documentation.docx'; Toc = $true  },
    @{ Src = 'SRS.md';                   Dst = 'SRS.docx';                   Toc = $true  },
    @{ Src = 'Testing_Report.md';        Dst = 'Testing_Report.docx';        Toc = $true  },
    @{ Src = 'Technical_Debt_Plan.md';   Dst = 'Technical_Debt_Plan.docx';   Toc = $true  },
    @{ Src = 'User_Manual.md';           Dst = 'User_Manual.docx';           Toc = $true  }
)

Push-Location $docs
try {
    foreach ($doc in $documents) {
        $target = Join-Path $out $doc.Dst

        $args = @(
            $doc.Src,
            '--from=gfm+yaml_metadata_block+tex_math_dollars',
            '--to=docx',
            '--output', $target,
            '--resource-path=.;./images',
            '--standalone'
        )
        if ($doc.Toc) { $args += @('--toc', '--toc-depth=3') }

        & pandoc @args
        if ($LASTEXITCODE -ne 0) { throw "pandoc failed on $($doc.Src)" }

        $kb = [math]::Round((Get-Item $target).Length / 1KB, 1)
        Write-Output ("{0,-32} -> {1,-32} {2,8} KB" -f $doc.Src, $doc.Dst, $kb)
    }
}
finally { Pop-Location }

# Deployment links file sits at the top level of the package
Copy-Item (Join-Path $root 'Deployment_and_Source_Links.txt') $out -Force

# Supporting files: diagram sources, rendered images, test harnesses, schema
Copy-Item (Join-Path $docs 'diagrams') $support -Recurse -Force
Copy-Item (Join-Path $docs 'images')   $support -Recurse -Force
Copy-Item (Join-Path $root 'tests')    $support -Recurse -Force
New-Item -ItemType Directory -Force -Path (Join-Path $support 'database') | Out-Null
Copy-Item (Join-Path $root 'prisma\schema.prisma') (Join-Path $support 'database') -Force
Copy-Item (Join-Path $root 'prisma\seed.ts')       (Join-Path $support 'database') -Force

# Markdown sources travel with the package so the documents remain editable
New-Item -ItemType Directory -Force -Path (Join-Path $support 'markdown-sources') | Out-Null
Get-ChildItem $docs -Filter *.md | Copy-Item -Destination (Join-Path $support 'markdown-sources') -Force

Write-Output ''
Write-Output "Package assembled at: $out"
Get-ChildItem $out -Recurse -File |
    Select-Object @{ n = 'File'; e = { $_.FullName.Replace("$out\", '') } },
                  @{ n = 'KB';   e = { [math]::Round($_.Length / 1KB, 1) } } |
    Format-Table -AutoSize

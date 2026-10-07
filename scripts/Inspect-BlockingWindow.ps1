param([switch]$ReleaseBoot)
$ErrorActionPreference='Stop'
# The incident helper records visible native windows, then optionally stops
# only this installation's boot player. Never stop Codex or generic topmost apps.
if(!('DragonAtelierWindowProbe' -as [type])){
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class DragonAtelierWindowProbe {
  [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left,Top,Right,Bottom; }
  [StructLayout(LayoutKind.Sequential)] public struct Point { public int X,Y; }
  public class Window { public long Handle; public uint ProcessId; public Rect Bounds; public bool Topmost,Hung; }
  delegate bool Callback(IntPtr h,IntPtr p);
  [DllImport("user32.dll")] static extern bool EnumWindows(Callback c,IntPtr p);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsHungAppWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h,out Rect r);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);
  [DllImport("user32.dll",EntryPoint="GetWindowLongW")] static extern int GetWindowLong(IntPtr h,int index);
  [DllImport("user32.dll")] static extern bool GetCursorPos(out Point p);
  [DllImport("user32.dll")] static extern IntPtr WindowFromPoint(Point p);
  [DllImport("user32.dll")] static extern IntPtr GetAncestor(IntPtr h,uint flags);
  public static long PointerWindow() { Point p;GetCursorPos(out p);return GetAncestor(WindowFromPoint(p),2).ToInt64(); }
  public static Window[] Snapshot() {
    var list=new List<Window>();
    EnumWindows((h,p)=>{ Rect r;uint pid;
      if(IsWindowVisible(h)&&GetWindowRect(h,out r)&&r.Right-r.Left>100&&r.Bottom-r.Top>100) {
        GetWindowThreadProcessId(h,out pid);
        list.Add(new Window{Handle=h.ToInt64(),ProcessId=pid,Bounds=r,Topmost=(GetWindowLong(h,-20)&8)!=0,Hung=IsHungAppWindow(h)});
      }return true;
    },IntPtr.Zero);return list.ToArray();
  }
}
'@
}
$root=Split-Path $PSScriptRoot -Parent
$output=Join-Path $root 'evidence\window-snapshots'
New-Item -ItemType Directory -Path $output -Force | Out-Null
$windows=@([DragonAtelierWindowProbe]::Snapshot() | ForEach-Object {
  $item=$_
  $process=Get-CimInstance Win32_Process -Filter "ProcessId=$($item.ProcessId)" -ErrorAction SilentlyContinue
  [pscustomobject]@{handle=$item.Handle;pid=$item.ProcessId;bounds=$item.Bounds;topmost=$item.Topmost;hung=$item.Hung;name=$process.Name;executable=$process.ExecutablePath}
})
$snapshot=@{time=(Get-Date).ToString('o');pointerWindow=[DragonAtelierWindowProbe]::PointerWindow();windows=$windows}
$file=Join-Path $output ((Get-Date -Format yyyyMMdd-HHmmss-fff)+'.json')
[IO.File]::WriteAllText($file,($snapshot | ConvertTo-Json -Depth 7),[Text.UTF8Encoding]::new($false))
Write-Host "Native window evidence saved: $file"
$windows | Where-Object {$_.topmost -or $_.hung} | Format-Table pid,name,topmost,hung,bounds
if($ReleaseBoot){
  $boot=Join-Path (Split-Path $root -Parent) 'tools\DragonCodexBoot\DragonCodexBoot.exe'
  $players=@(Get-CimInstance Win32_Process -Filter "Name='DragonCodexBoot.exe'" | Where-Object {$_.ExecutablePath -eq $boot})
  foreach($player in $players){
    $current=Get-CimInstance Win32_Process -Filter "ProcessId=$($player.ProcessId)" -ErrorAction SilentlyContinue
    if($current -and $current.ExecutablePath -eq $boot -and $current.CreationDate -eq $player.CreationDate){
      Stop-Process -Id $current.ProcessId
      Write-Host "Stopped verified boot player PID $($current.ProcessId)"
    }
  }
  if(!$players.Count){Write-Host 'No matching boot player is running. Other applications were preserved.'}
}

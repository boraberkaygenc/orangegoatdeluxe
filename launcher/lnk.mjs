// Minimal Windows shortcut (.lnk) writer, [MS-SHLLINK] format. Used only when PowerShell cannot make the shortcut
// (e.g. restricted language mode). Target is given by LinkInfo (local path, ANSI + Unicode); strings are Unicode.
const CLSID = Buffer.from([0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46]);
const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };
const ansi = s => Buffer.from(s.replace(/[^\x20-\x7e]/g, '?') + '\0', 'latin1');
const wide = s => Buffer.from(s + '\0', 'utf16le');
const str = s => { const b = Buffer.from(s, 'utf16le'); const n = Buffer.alloc(2); n.writeUInt16LE(s.length); return Buffer.concat([n, b]); };

export function writeLnk({ target, args = '', workingDir = '', icon = '', iconIndex = 0, showCmd = 1, description = '' }) {
  const HasLinkInfo = 0x2, HasName = 0x4, HasWorkingDir = 0x10, HasArguments = 0x20, HasIconLocation = 0x40, IsUnicode = 0x80;
  let flags = HasLinkInfo | IsUnicode;
  if (description) flags |= HasName;
  if (workingDir) flags |= HasWorkingDir;
  if (args) flags |= HasArguments;
  if (icon) flags |= HasIconLocation;

  const header = Buffer.alloc(0x4C);
  header.writeUInt32LE(0x4C, 0); CLSID.copy(header, 4);
  header.writeUInt32LE(flags, 20);
  header.writeUInt32LE(0x20, 24);               // FILE_ATTRIBUTE_ARCHIVE
  header.writeInt32LE(iconIndex, 56);
  header.writeUInt32LE(showCmd, 60);            // 1 normal, 3 maximized, 7 minimized

  // LinkInfo with the 0x24 header (Unicode offsets present)
  const volume = Buffer.concat([u32(17), u32(3 /* DRIVE_FIXED */), u32(0), u32(0x10), Buffer.from([0])]);
  const base = ansi(target), suffix = Buffer.from([0]), baseW = wide(target), suffixW = Buffer.from([0, 0]);
  const hdr = 0x24, volOff = hdr, baseOff = volOff + volume.length, sufOff = baseOff + base.length, baseWOff = sufOff + suffix.length, sufWOff = baseWOff + baseW.length;
  const size = sufWOff + suffixW.length;
  const linkInfo = Buffer.concat([u32(size), u32(hdr), u32(1 /* VolumeIDAndLocalBasePath */), u32(volOff), u32(baseOff), u32(0), u32(sufOff), u32(baseWOff), u32(sufWOff), volume, base, suffix, baseW, suffixW]);

  const strings = [];
  if (description) strings.push(str(description));
  if (workingDir) strings.push(str(workingDir));
  if (args) strings.push(str(args));
  if (icon) strings.push(str(icon));
  return Buffer.concat([header, linkInfo, ...strings, u32(0) /* terminal block */]);
}

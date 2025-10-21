import fs from 'fs'

export default {
  name: ".vcf",
  description: "Export all group members as a .vcf contact file",
  async execute(sock, msg) {
    const from = msg.key.remoteJid

    // Only works in groups
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg })
      return
    }

    // Fetch group info
    const metadata = await sock.groupMetadata(from)
    const participants = metadata.participants

    // Build the VCF data
    let vcf = ''
    for (const p of participants) {
      const jid = p.id
      const phone = jid.split('@')[0]
      vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:WA ${phone}\nTEL;type=CELL;type=VOICE;waid=${phone}:+${phone}\nEND:VCARD\n`
    }

    // Save file
    const safeName = metadata.subject.replace(/[^\w\s]/gi, '').trim() || 'group'
    const filePath = `./group_${safeName}_contacts.vcf`
    fs.writeFileSync(filePath, vcf, 'utf-8')

    // Let the user know it's working
    await sock.sendMessage(from, { text: `📦 Found ${participants.length} contacts.\n📤 Sending ${metadata.subject}.vcf ...` }, { quoted: msg })

    // Send file
    await sock.sendMessage(from, {
      document: fs.readFileSync(filePath),
      mimetype: 'text/vcard',
      fileName: `${metadata.subject}.vcf`
    }, { quoted: msg })

    // Clean up
    fs.unlinkSync(filePath)
  },
}

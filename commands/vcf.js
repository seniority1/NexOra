import fs from 'fs'

export default {
  name: ".vcf",
  description: "Export all group members as a .vcf contact file (with names if available)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid

    // ✅ Only works in groups
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg })
      return
    }

    // 🕐 Let user know it’s working
    await sock.sendMessage(from, { text: '⏳ Generating group contacts, please wait...' }, { quoted: msg })

    // 📋 Fetch group metadata
    const metadata = await sock.groupMetadata(from)
    const participants = metadata.participants

    let vcf = ''

    // 🧠 Try to fetch contact names (if available in store)
    for (const p of participants) {
      const jid = p.id
      const phone = jid.split('@')[0]

      // Try to get name from sock.store or contact info
      let name = null
      try {
        const contact = sock.store?.contacts?.[jid]
        name = contact?.name || contact?.notify || contact?.verifiedName
      } catch {
        name = null
      }

      // Fallback if no name found
      if (!name) name = `WA ${phone}`

      vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${phone}:+${phone}\nEND:VCARD\n`
    }

    // 💾 Save file
    const safeName = metadata.subject.replace(/[^\w\s]/gi, '').trim() || 'group'
    const filePath = `./group_${safeName}_contacts.vcf`
    fs.writeFileSync(filePath, vcf, 'utf-8')

    // 📤 Send summary
    await sock.sendMessage(from, {
      text: `✅ *${metadata.subject}*\n👥 Found *${participants.length}* contacts.\n📦 Sending file with names (if available)...`
    }, { quoted: msg })

    // 📎 Send VCF file
    await sock.sendMessage(from, {
      document: fs.readFileSync(filePath),
      mimetype: 'text/vcard',
      fileName: `${metadata.subject}.vcf`
    }, { quoted: msg })

    // 🧹 Clean up
    fs.unlinkSync(filePath)
  },
}

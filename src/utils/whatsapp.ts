export const generateWhatsAppMessage = (
  selectedDate: string,
  assignments: any[],
  statuses: any[],
  people: any[],
  roles: any[]
) => {
  const dateObj = new Date(selectedDate)
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  const todayDay = dayNames[dateObj.getDay()]
  const todayDate = dateObj.toLocaleDateString('he-IL')

  let message = `*דו"ח משמרות SHABZAK*\n`
  message += `*יום ${todayDay} | ${todayDate}*\n`
  message += `--------------------------\n\n`

  // 1. Assignments Section
  message += `☀️ *סיכום משמרות יום (08:30-20:30):*\n`
  roles.forEach(role => {
    const roleAssignments = assignments.filter(
      a => a.date === selectedDate && a.shift_type === 'day' && a.role_id === role.id
    )
    if (roleAssignments.length > 0) {
      message += `• *${role.role_name}:* ${roleAssignments.map(a => `${a.person?.first_name || ''} ${a.person?.last_name || ''}`).join(', ')}\n`
    }
  })

  message += `\n🌙 *סיכום משמרות לילה (20:30-08:30):*\n`
  roles.forEach(role => {
    const roleAssignments = assignments.filter(
      a => a.date === selectedDate && a.shift_type === 'night' && a.role_id === role.id
    )
    if (roleAssignments.length > 0) {
      message += `• *${role.role_name}:* ${roleAssignments.map(a => `${a.person?.first_name || ''} ${a.person?.last_name || ''}`).join(', ')}\n`
    }
  })

  message += `\n--------------------------\n`
  
  // 2. Full Personnel List (The Missing Part)
  message += `📋 *פירוט מצבה שמית:*\n`
  people.forEach(person => {
    const statusEntry = statuses.find(s => s.person_id === person.id)
    const statusText = statusEntry?.status || 'טרם הוגדר'
    message += `• ${person.first_name} ${person.last_name}: *${statusText}*\n`
  })

  message += `\n--------------------------\n`

  // 3. Statistical Summary
  message += `📊 *סיכום סטטיסטי:*\n`
  const base = statuses.filter(s => s.status === 'בסיס').length
  const home = statuses.filter(s => s.status === 'בית').length
  const closed = statuses.filter(s => s.status === 'סגור').length
  
  message += `📍 בבסיס: ${base}\n`
  message += `🏠 בבית: ${home}\n`
  message += `🚫 סגור: ${closed}\n`
  message += `👥 סה"כ כ"א: ${people.length}\n\n`
  
  message += `_נשלח ממערכת SHABZAK_`

  return message
}

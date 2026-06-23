// CRM contacts — GoHighLevel-style schema
export const crmContacts = [
  {
    id: "c001", name: "Maria Santos", phone: "+1 (555) 014-2200",
    email: "m.santos@email.com", insurance: "Blue Cross BlueShield",
    lastVisit: "2025-05-14", nextAppt: "2026-07-10 10:00",
    provider: "Dr. Chen", patientStatus: "existing",
    tags: ["psychiatry", "follow-up"], language: "en",
    reminderType: "appointment_reminder",
    scriptVars: { apptDate: "July 10", apptTime: "10:00 AM", provider: "Dr. Chen" },
  },
  {
    id: "c002", name: "James Whitfield", phone: "+1 (555) 029-3311",
    email: "j.whitfield@email.com", insurance: "Aetna",
    lastVisit: "2026-03-02", nextAppt: "2026-07-08 14:30",
    provider: "Dr. Patel", patientStatus: "existing",
    tags: ["therapy", "weekly"], language: "en",
    reminderType: "appointment_reminder",
    scriptVars: { apptDate: "July 8", apptTime: "2:30 PM", provider: "Dr. Patel" },
  },
  {
    id: "c003", name: "Sofia Reyes", phone: "+1 (555) 038-4400",
    email: "s.reyes@email.com", insurance: "Cigna",
    lastVisit: "2025-11-20", nextAppt: null,
    provider: "Dr. Chen", patientStatus: "inactive",
    tags: ["reactivation", "no-show"], language: "es",
    reminderType: "reactivation_outreach",
    scriptVars: { lastVisit: "November 2025", provider: "Dr. Chen" },
  },
  {
    id: "c004", name: "David Kim", phone: "+1 (555) 047-5512",
    email: "d.kim@email.com", insurance: "Medicare",
    lastVisit: "2026-05-30", nextAppt: "2026-07-15 09:00",
    provider: "Dr. Patel", patientStatus: "existing",
    tags: ["psychiatry", "medication-mgmt"], language: "en",
    reminderType: "appointment_reminder",
    scriptVars: { apptDate: "July 15", apptTime: "9:00 AM", provider: "Dr. Patel" },
  },
  {
    id: "c005", name: "Priya Nair", phone: "+1 (555) 056-6601",
    email: "p.nair@email.com", insurance: "UnitedHealth",
    lastVisit: "2026-06-01", nextAppt: "2026-07-05 11:00",
    provider: "Dr. Chen", patientStatus: "existing",
    tags: ["telehealth", "anxiety"], language: "en",
    reminderType: "post_visit_followup",
    scriptVars: { visitDate: "June 1", provider: "Dr. Chen" },
  },
  {
    id: "c006", name: "Marcus Brown", phone: "+1 (555) 065-7790",
    email: "m.brown@email.com", insurance: "Blue Cross BlueShield",
    lastVisit: null, nextAppt: "2026-07-09 15:00",
    provider: "Dr. Patel", patientStatus: "new",
    tags: ["new-patient", "intake"], language: "en",
    reminderType: "appointment_reminder",
    scriptVars: { apptDate: "July 9", apptTime: "3:00 PM", provider: "Dr. Patel" },
  },
  {
    id: "c007", name: "Ana Gutierrez", phone: "+1 (555) 074-8823",
    email: "a.gutierrez@email.com", insurance: "Molina Healthcare",
    lastVisit: "2026-04-18", nextAppt: null,
    provider: "Dr. Chen", patientStatus: "inactive",
    tags: ["reactivation", "no-show"], language: "es",
    reminderType: "reactivation_outreach",
    scriptVars: { lastVisit: "April 2026", provider: "Dr. Chen" },
  },
  {
    id: "c008", name: "Robert Okonkwo", phone: "+1 (555) 083-9934",
    email: "r.okonkwo@email.com", insurance: "Cigna",
    lastVisit: "2026-05-15", nextAppt: "2026-07-11 13:00",
    provider: "Dr. Patel", patientStatus: "existing",
    tags: ["therapy", "depression"], language: "en",
    reminderType: "post_visit_followup",
    scriptVars: { visitDate: "May 15", provider: "Dr. Patel" },
  },
];

// Outbound script templates by type
export const outboundScripts = {
  appointment_reminder: (vars) => [
    { speaker: "ai", text: `Hello, may I please speak with ${vars.name}?` },
    { speaker: "patient", text: "This is ${name}." },
    { speaker: "ai", text: `Hi ${vars.name}, this is your AI health assistant calling from TeleHealthy. I'm reaching out to confirm your upcoming appointment on ${vars.apptDate} at ${vars.apptTime} with ${vars.provider}.` },
    { speaker: "patient", text: "Yes, I'll be there." },
    { speaker: "ai", text: `Wonderful! Your appointment is confirmed for ${vars.apptDate} at ${vars.apptTime} with ${vars.provider}. You'll receive a reminder text the evening before. If anything changes, please call us at (555) 200-4820.` },
    { speaker: "patient", text: "Got it, thank you." },
    { speaker: "ai", text: "Our pleasure! Have a great day and we look forward to seeing you at TeleHealthy. Goodbye!" },
  ],
  reactivation_outreach: (vars) => [
    { speaker: "ai", text: `Hello, may I please speak with ${vars.name}?` },
    { speaker: "patient", text: "Speaking." },
    { speaker: "ai", text: `Hi ${vars.name}, this is your AI health assistant from TeleHealthy. We noticed it's been a while since your last visit in ${vars.lastVisit} with ${vars.provider}. We just wanted to check in and see how you're doing.` },
    { speaker: "patient", text: "I've been okay, just busy." },
    { speaker: "ai", text: `We completely understand. ${vars.provider} wanted to reach out personally -- your ongoing care is important to us. Would you like to schedule a follow-up at a time that works for you? We have flexible telehealth slots available as well.` },
    { speaker: "patient", text: "Sure, maybe next week." },
    { speaker: "ai", text: "Perfect! I'm noting your interest in scheduling next week. Our team will follow up with available times within 24 hours. Thank you for your time and take care!" },
  ],
  post_visit_followup: (vars) => [
    { speaker: "ai", text: `Hello, may I please speak with ${vars.name}?` },
    { speaker: "patient", text: "Yes, this is ${name}." },
    { speaker: "ai", text: `Hi ${vars.name}, this is your AI health assistant from TeleHealthy. I'm calling to follow up on your visit on ${vars.visitDate} with ${vars.provider}. How have you been feeling since your appointment?` },
    { speaker: "patient", text: "Better, thank you for checking." },
    { speaker: "ai", text: `That's great to hear! ${vars.provider} will review your progress notes. If you experience any changes or have questions before your next visit, don't hesitate to call us. Is there anything else I can help you with today?` },
    { speaker: "patient", text: "No, that's all." },
    { speaker: "ai", text: "Perfect. Thank you for being a TeleHealthy patient. We'll see you at your next appointment. Take care, goodbye!" },
  ],
};

// FAQ responses EN/ES
export const faqResponses = {
  hours: {
    en: "We're open Monday through Friday 8 AM to 6 PM, and Saturday 9 AM to 1 PM. For after-hours needs, leave a message and we'll return your call the next business day.",
    es: "Estamos abiertos de lunes a viernes de 8 AM a 6 PM, y los sabados de 9 AM a 1 PM. Para necesidades fuera de horario, deje un mensaje.",
  },
  insurance: {
    en: "We accept Blue Cross BlueShield, Aetna, Cigna, UnitedHealth, Medicare, and Molina Healthcare. Would you like to verify your specific plan? I can connect you with our billing team.",
    es: "Aceptamos Blue Cross BlueShield, Aetna, Cigna, UnitedHealth, Medicare y Molina Healthcare. Le puedo conectar con nuestro equipo de facturacion.",
  },
  telehealth: {
    en: "Yes! We offer HIPAA-compliant secure video appointments for established patients. You'll need a device with a camera and stable internet. Telehealth slots are available daily, Monday through Saturday.",
    es: "Si, ofrecemos citas de video seguras y compatibles con HIPAA para pacientes establecidos. Necesitara un dispositivo con camara e internet estable.",
  },
  "New Patient": {
    en: "Welcome! New patient intake appointments are 60 minutes. We'll collect your insurance info and medical history. You can also complete intake forms online through our patient portal before your visit.",
    es: "Bienvenido! Las citas de evaluacion inicial para nuevos pacientes duran 60 minutos. Puede completar los formularios en linea a traves de nuestro portal.",
  },
  location: {
    en: "Our main clinic is at 4820 Wellness Blvd, Suite 200. Parking is validated in the attached garage -- just bring your ticket to the front desk. We're on the third floor.",
    es: "Nuestra clinica principal esta en 4820 Wellness Blvd, Suite 200. El estacionamiento esta validado en el garaje adjunto.",
  },
};

// Analytics seed data
export const analyticsData = {
  callVolume: [
    { day: "Mon", calls: 24 }, { day: "Tue", calls: 31 }, { day: "Wed", calls: 28 },
    { day: "Thu", calls: 19 }, { day: "Fri", calls: 35 }, { day: "Sat", calls: 12 }, { day: "Sun", calls: 6 },
  ],
  intentBreakdown: [
    { name: "Booking", value: 58 },
    { name: "FAQ", value: 29 },
    { name: "Escalated", value: 13 },
  ],
  kpis: {
    bookingRate: "67%",
    escalationRate: "8%",
    avgConfidence: "0.79",
    avgHandleTime: "2m 14s",
    totalCalls: 155,
    smsConfirmations: 104,
  },
  transcripts: [
    { id: "t001", caller: "+1 (555) 142-8800", intent: "BOOK", duration: "1:47", confidence: 0.88,
      summary: "New patient intake booked for July 9 with Dr. Patel", escalated: false },
    { id: "t002", caller: "+1 (555) 293-1122", intent: "FAQ", duration: "0:52", confidence: 0.91,
      summary: "Telehealth eligibility inquiry resolved", escalated: false },
    { id: "t003", caller: "+1 (555) 384-4409", intent: "ESCALATE", duration: "0:28", confidence: 0.38,
      summary: "Low confidence -- transferred to care coordinator", escalated: true },
    { id: "t004", caller: "+1 (555) 475-5511", intent: "BOOK", duration: "2:31", confidence: 0.82,
      summary: "Existing patient rescheduled to July 15 10:00 AM", escalated: false },
    { id: "t005", caller: "+1 (555) 567-6622", intent: "FAQ", duration: "1:05", confidence: 0.85,
      summary: "Insurance verification -- Blue Cross confirmed accepted", escalated: false },
  ],
};

// Available appointment slots
export const availableSlots = [
  "Mon Jul 7, 10:00 AM",
  "Tue Jul 8, 2:30 PM",
  "Wed Jul 9, 11:00 AM",
  "Thu Jul 10, 9:00 AM",
  "Fri Jul 11, 3:00 PM",
];

export const providers = ["Dr. Chen", "Dr. Patel"];

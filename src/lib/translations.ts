// Frontend translations for EN/SK
export type Language = "en" | "sk";

export const translations = {
  en: {
    // Navigation
    nav: {
      dashboard: "Dashboard",
      subjects: "Subjects",
      enrolment: "Enrolment",
      schedule: "Schedule",
      grades: "Grades",
      assignments: "Assignments",
      dormitory: "Dormitory",
      thesis: "Thesis",
      payments: "Payments",
      notifications: "Notifications",
      profile: "Profile",
      activity: "Activity Log",
      settings: "Settings",
      documents: "Documents",
      logout: "Log out",
    },
    
    // Common
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      create: "Create",
      submit: "Submit",
      close: "Close",
      loading: "Loading...",
      saving: "Saving...",
      success: "Success",
      error: "Error",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      search: "Search",
      filter: "Filter",
      all: "All",
      none: "None",
      yes: "Yes",
      no: "No",
      download: "Download",
      upload: "Upload",
      view: "View",
      actions: "Actions",
    },
    
    // Auth
    auth: {
      login: "Login",
      logout: "Logout",
      register: "Register",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      rememberMe: "Remember me",
      loginSuccess: "Login successful",
      loginError: "Invalid email or password",
      twoFactorRequired: "Two-factor authentication required",
      enterCode: "Enter 6-digit code",
      verifyCode: "Verify Code",
    },
    
    // Profile
    profile: {
      title: "Profile",
      subtitle: "Manage your account information",
      editProfile: "Edit Profile",
      changePassword: "Change Password",
      fullName: "Full Name",
      phone: "Phone",
      address: "Address",
      profilePicture: "Profile Picture",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password",
      profileUpdated: "Profile updated successfully",
      passwordChanged: "Password changed successfully",
      role: "Role",
      accountStatus: "Account Status",
      active: "Active",
      inactive: "Inactive",
    },
    
    // Settings
    settings: {
      title: "Settings",
      subtitle: "Manage your preferences and account settings",
      appearance: "Appearance",
      theme: "Theme",
      darkMode: "Dark Mode",
      darkModeDesc: "Use dark theme for reduced eye strain",
      language: "Language",
      languageDesc: "Select your preferred language",
      timezone: "Timezone",
      timezoneDesc: "Set your local timezone",
      notifications: "Notifications",
      enableNotifications: "Enable Notifications",
      notificationsDesc: "Receive notifications about grades, schedules, and updates",
      security: "Security & Privacy",
      twoFactor: "Two-Factor Authentication",
      twoFactorDesc: "Add extra security to your account",
      enable: "Enable",
      disable: "Disable",
      enabled: "Enabled",
      disabled: "Disabled",
      saveChanges: "Save Changes",
      settingsSaved: "Settings saved successfully",
    },
    
    // Payments
    payments: {
      title: "Payments",
      subtitle: "Manage your tuition, dormitory, and other university payments",
      accountBalance: "Account Balance",
      amountDue: "Amount Due",
      allPaid: "All Paid",
      upcomingPayments: "Upcoming Payments",
      paymentHistory: "Payment History",
      paymentMethods: "Payment Methods",
      payNow: "Pay Now",
      createPayment: "Create Payment",
      invoiceNumber: "Invoice Number",
      dueDate: "Due Date",
      paidDate: "Paid Date",
      amount: "Amount",
      status: "Status",
      type: "Type",
      description: "Description",
      selectUser: "Select User",
      selectType: "Select Type",
      paid: "Paid",
      pending: "Pending",
      overdue: "Overdue",
      cancelled: "Cancelled",
      tuition: "Tuition Fee",
      dormitoryFee: "Dormitory Fee",
      adminFee: "Administrative Fee",
      bankTransfer: "Bank Transfer",
      creditCard: "Credit/Debit Card",
      cash: "Cash",
      paymentSuccess: "Payment successful",
      paymentCancelled: "Payment cancelled",
      downloadInvoice: "Download Invoice",
    },
    
    // Documents
    documents: {
      title: "Documents",
      subtitle: "Download official documents and upload submissions",
      officialDocuments: "Official Documents",
      myUploads: "My Uploads",
      uploadDocument: "Upload Document",
      enrollmentProof: "Proof of Enrollment",
      gradeTranscript: "Grade Transcript",
      downloadDesc: "Download official university documents",
      uploadDesc: "Upload documents for assignments or applications",
      selectFile: "Select File",
      documentType: "Document Type",
      uploadSuccess: "Document uploaded successfully",
      deleteSuccess: "Document deleted successfully",
      allowedTypes: "Allowed types: PDF, DOC, DOCX, JPEG, PNG",
      maxSize: "Maximum file size: 10MB",
    },
    
    // 2FA
    twoFactor: {
      setup: "Set up Two-Factor Authentication",
      scanQR: "Scan this QR code with your authenticator app",
      orEnterManually: "Or enter this code manually:",
      enterVerificationCode: "Enter verification code",
      verify: "Verify",
      disable: "Disable 2FA",
      disableConfirm: "Enter your current 2FA code to disable",
      setupSuccess: "Two-factor authentication enabled successfully",
      disableSuccess: "Two-factor authentication disabled",
      invalidCode: "Invalid verification code",
    },
    
    // Dashboard
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome back",
      upcomingExams: "Upcoming Exams",
      recentGrades: "Recent Grades",
      todaySchedule: "Today's Schedule",
      notifications: "Notifications",
      quickActions: "Quick Actions",
    },
    
    // Grades
    grades: {
      title: "Grades",
      subtitle: "View your academic performance and grades",
      overallGPA: "Overall GPA",
      currentSemesterGPA: "Current Semester GPA",
      totalCredits: "Total Credits",
      gradeHistory: "Grade History",
      subject: "Subject",
      code: "Code",
      semester: "Semester",
      grade: "Grade",
      date: "Date",
      addGrade: "Add Grade",
      editGrade: "Edit Grade",
    },
  },
  
  sk: {
    // Navigation
    nav: {
      dashboard: "Prehľad",
      subjects: "Predmety",
      enrolment: "Zápis",
      schedule: "Rozvrh",
      grades: "Známky",
      assignments: "Zadania",
      dormitory: "Internát",
      thesis: "Záverečná práca",
      payments: "Platby",
      notifications: "Notifikácie",
      profile: "Profil",
      activity: "Aktivita",
      settings: "Nastavenia",
      documents: "Dokumenty",
      logout: "Odhlásiť sa",
    },
    
    // Common
    common: {
      save: "Uložiť",
      cancel: "Zrušiť",
      delete: "Vymazať",
      edit: "Upraviť",
      add: "Pridať",
      create: "Vytvoriť",
      submit: "Odoslať",
      close: "Zavrieť",
      loading: "Načítava sa...",
      saving: "Ukladá sa...",
      success: "Úspech",
      error: "Chyba",
      confirm: "Potvrdiť",
      back: "Späť",
      next: "Ďalej",
      search: "Hľadať",
      filter: "Filtrovať",
      all: "Všetko",
      none: "Žiadne",
      yes: "Áno",
      no: "Nie",
      download: "Stiahnuť",
      upload: "Nahrať",
      view: "Zobraziť",
      actions: "Akcie",
    },
    
    // Auth
    auth: {
      login: "Prihlásiť sa",
      logout: "Odhlásiť sa",
      register: "Registrovať sa",
      email: "Email",
      password: "Heslo",
      confirmPassword: "Potvrdiť heslo",
      forgotPassword: "Zabudnuté heslo?",
      rememberMe: "Zapamätať si ma",
      loginSuccess: "Prihlásenie úspešné",
      loginError: "Nesprávny email alebo heslo",
      twoFactorRequired: "Vyžaduje sa dvojfaktorová autentifikácia",
      enterCode: "Zadajte 6-miestny kód",
      verifyCode: "Overiť kód",
    },
    
    // Profile
    profile: {
      title: "Profil",
      subtitle: "Spravujte informácie o vašom účte",
      editProfile: "Upraviť profil",
      changePassword: "Zmeniť heslo",
      fullName: "Celé meno",
      phone: "Telefón",
      address: "Adresa",
      profilePicture: "Profilová fotka",
      currentPassword: "Aktuálne heslo",
      newPassword: "Nové heslo",
      confirmNewPassword: "Potvrdiť nové heslo",
      profileUpdated: "Profil bol úspešne aktualizovaný",
      passwordChanged: "Heslo bolo úspešne zmenené",
      role: "Rola",
      accountStatus: "Stav účtu",
      active: "Aktívny",
      inactive: "Neaktívny",
    },
    
    // Settings
    settings: {
      title: "Nastavenia",
      subtitle: "Spravujte svoje preferencie a nastavenia účtu",
      appearance: "Vzhľad",
      theme: "Téma",
      darkMode: "Tmavý režim",
      darkModeDesc: "Použite tmavú tému pre menšie namáhanie očí",
      language: "Jazyk",
      languageDesc: "Vyberte preferovaný jazyk",
      timezone: "Časové pásmo",
      timezoneDesc: "Nastavte vaše lokálne časové pásmo",
      notifications: "Notifikácie",
      enableNotifications: "Povoliť notifikácie",
      notificationsDesc: "Dostávajte notifikácie o známkach, rozvrhu a aktualizáciách",
      security: "Bezpečnosť a súkromie",
      twoFactor: "Dvojfaktorová autentifikácia",
      twoFactorDesc: "Pridajte extra zabezpečenie vášho účtu",
      enable: "Povoliť",
      disable: "Zakázať",
      enabled: "Povolené",
      disabled: "Zakázané",
      saveChanges: "Uložiť zmeny",
      settingsSaved: "Nastavenia boli úspešne uložené",
    },
    
    // Payments
    payments: {
      title: "Platby",
      subtitle: "Spravujte školné, ubytovanie a ďalšie univerzitné platby",
      accountBalance: "Zostatok účtu",
      amountDue: "Suma na úhradu",
      allPaid: "Všetko uhradené",
      upcomingPayments: "Nadchádzajúce platby",
      paymentHistory: "História platieb",
      paymentMethods: "Platobné metódy",
      payNow: "Zaplatiť teraz",
      createPayment: "Vytvoriť platbu",
      invoiceNumber: "Číslo faktúry",
      dueDate: "Dátum splatnosti",
      paidDate: "Dátum úhrady",
      amount: "Suma",
      status: "Stav",
      type: "Typ",
      description: "Popis",
      selectUser: "Vybrať používateľa",
      selectType: "Vybrať typ",
      paid: "Uhradené",
      pending: "Čakajúce",
      overdue: "Po splatnosti",
      cancelled: "Zrušené",
      tuition: "Školné",
      dormitoryFee: "Poplatok za internát",
      adminFee: "Administratívny poplatok",
      bankTransfer: "Bankový prevod",
      creditCard: "Kreditná/Debetná karta",
      cash: "Hotovosť",
      paymentSuccess: "Platba úspešná",
      paymentCancelled: "Platba zrušená",
      downloadInvoice: "Stiahnuť faktúru",
    },
    
    // Documents
    documents: {
      title: "Dokumenty",
      subtitle: "Stiahnite oficiálne dokumenty a nahrajte odovzdania",
      officialDocuments: "Oficiálne dokumenty",
      myUploads: "Moje nahrané súbory",
      uploadDocument: "Nahrať dokument",
      enrollmentProof: "Potvrdenie o štúdiu",
      gradeTranscript: "Výpis známok",
      downloadDesc: "Stiahnite oficiálne univerzitné dokumenty",
      uploadDesc: "Nahrajte dokumenty pre zadania alebo žiadosti",
      selectFile: "Vybrať súbor",
      documentType: "Typ dokumentu",
      uploadSuccess: "Dokument bol úspešne nahraný",
      deleteSuccess: "Dokument bol úspešne vymazaný",
      allowedTypes: "Povolené typy: PDF, DOC, DOCX, JPEG, PNG",
      maxSize: "Maximálna veľkosť súboru: 10MB",
    },
    
    // 2FA
    twoFactor: {
      setup: "Nastaviť dvojfaktorovú autentifikáciu",
      scanQR: "Naskenujte tento QR kód pomocou autentifikačnej aplikácie",
      orEnterManually: "Alebo zadajte tento kód manuálne:",
      enterVerificationCode: "Zadajte overovací kód",
      verify: "Overiť",
      disable: "Zakázať 2FA",
      disableConfirm: "Zadajte váš aktuálny 2FA kód pre zakázanie",
      setupSuccess: "Dvojfaktorová autentifikácia bola úspešne povolená",
      disableSuccess: "Dvojfaktorová autentifikácia bola zakázaná",
      invalidCode: "Neplatný overovací kód",
    },
    
    // Dashboard
    dashboard: {
      title: "Prehľad",
      welcome: "Vitajte späť",
      upcomingExams: "Nadchádzajúce skúšky",
      recentGrades: "Posledné známky",
      todaySchedule: "Dnešný rozvrh",
      notifications: "Notifikácie",
      quickActions: "Rýchle akcie",
    },
    
    // Grades
    grades: {
      title: "Známky",
      subtitle: "Zobrazte si váš akademický výkon a známky",
      overallGPA: "Celkový priemer",
      currentSemesterGPA: "Priemer aktuálneho semestra",
      totalCredits: "Celkové kredity",
      gradeHistory: "História známok",
      subject: "Predmet",
      code: "Kód",
      semester: "Semester",
      grade: "Známka",
      date: "Dátum",
      addGrade: "Pridať známku",
      editGrade: "Upraviť známku",
    },
  },
};

export function useTranslation(lang: Language) {
  return translations[lang] || translations.en;
}

export function t(lang: Language, path: string): string {
  const keys = path.split(".");
  let result: any = translations[lang] || translations.en;
  
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) {
      // Fallback to English
      result = translations.en;
      for (const k of keys) {
        result = result?.[k];
        if (result === undefined) return path;
      }
      break;
    }
  }
  
  return typeof result === "string" ? result : path;
}


"""
Translation helper for Slovak/English messages
"""

TRANSLATIONS = {
    "en": {
        # Auth
        "unauthorized": "Unauthorized access",
        "invalid_credentials": "Invalid email or password",
        "inactive_user": "Inactive user account",
        "email_registered": "Email already registered",
        "password_changed": "Password changed successfully",
        "invalid_password": "Invalid password",
        "passwords_not_match": "Passwords do not match",
        "password_too_short": "Password must be at least 6 characters",
        
        # 2FA
        "2fa_enabled": "Two-factor authentication enabled",
        "2fa_disabled": "Two-factor authentication disabled",
        "2fa_already_enabled": "2FA is already enabled",
        "2fa_not_enabled": "2FA is not enabled",
        "2fa_invalid_code": "Invalid verification code",
        "2fa_setup_required": "2FA setup not initiated",
        
        # Payments
        "payment_created": "Payment created successfully",
        "payment_successful": "Payment successful",
        "payment_cancelled": "Payment cancelled",
        "payment_not_found": "Payment not found",
        "payment_already_paid": "Payment already paid",
        "cannot_cancel_paid": "Cannot cancel a paid payment",
        
        # Documents
        "document_uploaded": "Document uploaded successfully",
        "document_deleted": "Document deleted successfully",
        "document_not_found": "Document not found",
        "file_not_found": "File not found on server",
        "file_type_not_allowed": "File type not allowed",
        
        # General
        "not_found": "Resource not found",
        "not_authorized": "Not authorized",
        "success": "Operation successful",
        "error": "An error occurred",
        "saved": "Changes saved",
        "deleted": "Deleted successfully",
        "updated": "Updated successfully",
        "created": "Created successfully",
        
        # User
        "user_not_found": "User not found",
        "profile_updated": "Profile updated successfully",
        "settings_updated": "Settings updated successfully",
        
        # Subjects
        "subject_not_found": "Subject not found",
        "already_enrolled": "Already enrolled in this subject",
        "enrollment_confirmed": "Enrollment confirmed",
        
        # Grades
        "grade_added": "Grade added successfully",
        "grade_updated": "Grade updated successfully",
        "grade_deleted": "Grade deleted successfully",
        
        # Dormitory
        "dormitory_not_found": "Dormitory not found",
        "application_submitted": "Application submitted successfully",
        "application_approved": "Application approved",
        "application_rejected": "Application rejected",
        
        # Thesis
        "thesis_not_found": "Thesis not found",
        "thesis_created": "Thesis created successfully",
        
        # Assignments
        "assignment_not_found": "Assignment not found",
        "submission_received": "Submission received successfully",
        "already_submitted": "You have already submitted this assignment",
    },
    
    "sk": {
        # Auth
        "unauthorized": "Neautorizovaný prístup",
        "invalid_credentials": "Nesprávny email alebo heslo",
        "inactive_user": "Neaktívny používateľský účet",
        "email_registered": "Email je už registrovaný",
        "password_changed": "Heslo bolo úspešne zmenené",
        "invalid_password": "Nesprávne heslo",
        "passwords_not_match": "Heslá sa nezhodujú",
        "password_too_short": "Heslo musí mať aspoň 6 znakov",
        
        # 2FA
        "2fa_enabled": "Dvojfaktorová autentifikácia bola povolená",
        "2fa_disabled": "Dvojfaktorová autentifikácia bola zakázaná",
        "2fa_already_enabled": "2FA je už povolená",
        "2fa_not_enabled": "2FA nie je povolená",
        "2fa_invalid_code": "Neplatný overovací kód",
        "2fa_setup_required": "Nastavenie 2FA nebolo iniciované",
        
        # Payments
        "payment_created": "Platba bola úspešne vytvorená",
        "payment_successful": "Platba úspešná",
        "payment_cancelled": "Platba bola zrušená",
        "payment_not_found": "Platba nebola nájdená",
        "payment_already_paid": "Platba už bola uhradená",
        "cannot_cancel_paid": "Nie je možné zrušiť uhradenú platbu",
        
        # Documents
        "document_uploaded": "Dokument bol úspešne nahraný",
        "document_deleted": "Dokument bol úspešne vymazaný",
        "document_not_found": "Dokument nebol nájdený",
        "file_not_found": "Súbor nebol nájdený na serveri",
        "file_type_not_allowed": "Typ súboru nie je povolený",
        
        # General
        "not_found": "Zdroj nebol nájdený",
        "not_authorized": "Neautorizovaný",
        "success": "Operácia úspešná",
        "error": "Vyskytla sa chyba",
        "saved": "Zmeny boli uložené",
        "deleted": "Úspešne vymazané",
        "updated": "Úspešne aktualizované",
        "created": "Úspešne vytvorené",
        
        # User
        "user_not_found": "Používateľ nebol nájdený",
        "profile_updated": "Profil bol úspešne aktualizovaný",
        "settings_updated": "Nastavenia boli úspešne aktualizované",
        
        # Subjects
        "subject_not_found": "Predmet nebol nájdený",
        "already_enrolled": "Už ste zapísaný v tomto predmete",
        "enrollment_confirmed": "Zápis potvrdený",
        
        # Grades
        "grade_added": "Známka bola úspešne pridaná",
        "grade_updated": "Známka bola úspešne aktualizovaná",
        "grade_deleted": "Známka bola úspešne vymazaná",
        
        # Dormitory
        "dormitory_not_found": "Internát nebol nájdený",
        "application_submitted": "Žiadosť bola úspešne podaná",
        "application_approved": "Žiadosť bola schválená",
        "application_rejected": "Žiadosť bola zamietnutá",
        
        # Thesis
        "thesis_not_found": "Záverečná práca nebola nájdená",
        "thesis_created": "Záverečná práca bola úspešne vytvorená",
        
        # Assignments
        "assignment_not_found": "Zadanie nebolo nájdené",
        "submission_received": "Odovzdanie bolo úspešne prijaté",
        "already_submitted": "Toto zadanie ste už odovzdali",
    }
}


def translate(key: str, lang: str = "en") -> str:
    """Get translated message for a key"""
    if lang not in TRANSLATIONS:
        lang = "en"
    return TRANSLATIONS.get(lang, {}).get(key, TRANSLATIONS["en"].get(key, key))


def get_all_translations(lang: str = "en") -> dict:
    """Get all translations for a language"""
    if lang not in TRANSLATIONS:
        lang = "en"
    return TRANSLATIONS.get(lang, TRANSLATIONS["en"])


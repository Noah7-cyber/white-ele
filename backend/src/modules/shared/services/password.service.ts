import bcrypt from 'bcryptjs';

export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

export interface PasswordRequirements {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
}

class PasswordService {
    private readonly saltRounds = 12;
    private readonly defaultRequirements: PasswordRequirements = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
    };

    /**
     * Hash password using bcrypt with proper salt rounds
     */
    async hashPassword(password: string): Promise<string> {
        try {
            return await bcrypt.hash(password, this.saltRounds);
        } catch (error) {
            throw new Error('Failed to hash password');
        }
    }

    /**
     * Compare plain password with hashed password
     */
    async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        try {
            if (!plainPassword || !hashedPassword) {
                return false;
            }
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error('Password comparison error:', error);
            return false;
        }
    }

    /**
     * Validate password against complexity requirements
     */
    validatePassword(
        password: string, 
        requirements: Partial<PasswordRequirements> = {}
    ): PasswordValidationResult {
        const rules = { ...this.defaultRequirements, ...requirements };
        const errors: string[] = [];

        // Check minimum length
        if (password.length < rules.minLength) {
            errors.push(`Password must be at least ${rules.minLength} characters long`);
        }

        // Check uppercase requirement
        if (rules.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        // Check lowercase requirement
        if (rules.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        // Check numbers requirement
        if (rules.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        // Check special characters requirement
        if (rules.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        // Calculate strength
        const strength = this.calculatePasswordStrength(password);

        return {
            isValid: errors.length === 0,
            errors,
            strength,
        };
    }

    /**
     * Calculate password strength based on various criteria
     */
    calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
        let score = 0;

        // Length scoring
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;

        // Character variety scoring
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

        // Pattern scoring
        if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
        if (!/123|abc|qwe|password|admin/i.test(password)) score += 1; // No common patterns

        // Determine strength based on score
        if (score <= 3) return 'weak';
        if (score <= 6) return 'medium';
        return 'strong';
    }

    /**
     * Check if password contains common weak patterns
     */
    hasWeakPatterns(password: string): boolean {
        const weakPatterns = [
            /password/i,
            /123456/,
            /qwerty/i,
            /admin/i,
            /letmein/i,
            /welcome/i,
            /monkey/i,
            /dragon/i,
            /(.)\1{3,}/, // 4 or more repeated characters
            /^(.{1,3})\1+$/, // Repeated short patterns like "abcabc"
        ];

        return weakPatterns.some(pattern => pattern.test(password));
    }

    /**
     * Generate password strength suggestions
     */
    getPasswordSuggestions(password: string): string[] {
        const suggestions: string[] = [];

        if (password.length < 8) {
            suggestions.push('Use at least 8 characters');
        }

        if (!/[A-Z]/.test(password)) {
            suggestions.push('Add uppercase letters');
        }

        if (!/[a-z]/.test(password)) {
            suggestions.push('Add lowercase letters');
        }

        if (!/\d/.test(password)) {
            suggestions.push('Add numbers');
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            suggestions.push('Add special characters');
        }

        if (this.hasWeakPatterns(password)) {
            suggestions.push('Avoid common words and patterns');
        }

        if (password.length < 12) {
            suggestions.push('Consider using 12+ characters for better security');
        }

        return suggestions;
    }

    /**
     * Check if password has been compromised (basic implementation)
     * In production, this could integrate with HaveIBeenPwned API
     */
    async isPasswordCompromised(password: string): Promise<boolean> {
        // Basic check for very common passwords
        const commonPasswords = [
            'password', '123456', 'password123', 'admin', 'qwerty',
            'letmein', 'welcome', 'monkey', 'dragon', '123456789',
            'football', 'iloveyou', 'admin123', 'welcome123', 'password1',
            // Add some commonly used passwords that meet complexity requirements
            'password123!', 'admin123!', 'welcome123!', 'password1!',
            'qwerty123!', 'letmein123!', 'football123!', 'monkey123!'
        ];

        return commonPasswords.includes(password.toLowerCase());
    }

    /**
     * Generate a secure random password
     */
    generateSecurePassword(length: number = 16): string {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        const allChars = lowercase + uppercase + numbers + specialChars;
        
        let password = '';
        
        // Ensure at least one character from each category
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += specialChars[Math.floor(Math.random() * specialChars.length)];
        
        // Fill the rest randomly
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the password to avoid predictable patterns
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    /**
     * Validate password change request
     */
    async validatePasswordChange(
        currentPassword: string,
        newPassword: string,
        hashedCurrentPassword: string,
        passwordHistory?: string[]
    ): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // Verify current password
        const isCurrentPasswordValid = await this.comparePassword(currentPassword, hashedCurrentPassword);
        if (!isCurrentPasswordValid) {
            errors.push('Current password is incorrect');
        }

        // Validate new password
        const validation = this.validatePassword(newPassword);
        if (!validation.isValid) {
            errors.push(...validation.errors);
        }

        // Check if new password is same as current
        const isSamePassword = await this.comparePassword(newPassword, hashedCurrentPassword);
        if (isSamePassword) {
            errors.push('New password must be different from current password');
        }

        // Check password history (prevent reuse of last 5 passwords)
        if (passwordHistory && passwordHistory.length > 0) {
            for (const historicalPassword of passwordHistory.slice(-5)) {
                const isReused = await this.comparePassword(newPassword, historicalPassword);
                if (isReused) {
                    errors.push('Cannot reuse any of your last 5 passwords');
                    break;
                }
            }
        }

        // Check if password is compromised
        const isCompromised = await this.isPasswordCompromised(newPassword);
        if (isCompromised) {
            errors.push('This password is commonly used and not secure');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

export const passwordService = new PasswordService();
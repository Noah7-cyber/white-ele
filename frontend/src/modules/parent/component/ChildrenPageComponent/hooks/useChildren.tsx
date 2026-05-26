import { useState, useEffect, useCallback } from "react";
import client from "@/utils/client";
import { ParentDynamicEndpoints, KioskVerifyResponse } from "@/services/parent.service";
import { showToast } from "@/modules/shared/component/Toast";
import { useUser } from "@/utils/hooks/useUser";

export interface Child {
    id: number;
    userId: number;
    admissionNumber: string;
    enrolmentDate: string;
    schedule: string[];
    photoUrl: string;
    schoolId: number;
    classroomId: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    attendancePercentage: number;
    user: {
        id: number;
        uuid: string;
        email: string | null;
        phone: string | null;
        tempPassword: boolean;
        role: string;
        firstName: string;
        lastName: string;
        middleName: string | null;
        dateOfBirth: string;
        gender: string | null;
        address: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        lastLogin: string | null;
        loginAttempts: number;
        lockedUntil: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: string | null;
        mfaEnabled: boolean;
        enableEmailNotification: boolean;
        enableSmsNotification: boolean;
        enableInAppNotification: boolean;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        schoolId: number;
    };
    classroom: {
        id: number;
        classroomName: string;
        minimumAge: number;
        maximumAge: number;
        maximumCapacity: number;
        description: string | null;
        tuitionFee: string;
        classroomStatus: string;
        schoolId: number;
        createdAt: string;
        updatedAt: string;
    };
    currentAttendance: {
        id: number;
        date: string;
        status: string;
        timeIn: string;
        timeOut: string | null;
        notes: string | null;
        recordedBy: number;
        classroomId: number;
        studentId: number;
        teacherId: number | null;
        parentId: number;
        schoolId: number;
        createdAt: string;
        updatedAt: string;
    } | null;
    previousAttendance: {
        id: number;
        date: string;
        status: string;
        timeIn: string;
        timeOut: string | null;
        notes: string | null;
        recordedBy: number;
        classroomId: number;
        studentId: number;
        teacherId: number | null;
        parentId: number;
        schoolId: number;
        createdAt: string;
        updatedAt: string;
    } | null;
}

export const useChildren = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { parentId, isProfileLoading } = useUser();

    const fetchChildren = useCallback(async () => {
        if (isProfileLoading) {
            setIsLoading(true);
            return;
        }

        if (!parentId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await client.request<void, KioskVerifyResponse>(
                ParentDynamicEndpoints.getParentById(parentId)
            );

            if (response.success && response.data?.children) {
                setChildren(response.data.children);
            } else {
                setChildren([]);
            }
        } catch (err) {
            console.error("Error fetching children:", err);
            setChildren([]);
            showToast({
                message: "Error",
                description: "Failed to load children",
                severity: "error",
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    }, [isProfileLoading, parentId]);

    useEffect(() => {
        void fetchChildren();
    }, [fetchChildren]);

    return {
        children,
        isLoading,
        error,
        parentId,
        refetchChildren: fetchChildren,
    };
};

import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  authServices,
  authDynamicEndpoints,
  InviteUserRequest,
  InviteUserResponse,
  GetInvitationsResponse,
  UpdateInvitationRequest,
} from "@/services/auth.service";
import { schoolDynamicEndpoints, GetSchoolResponse } from "@/services/school.service";

export const useInviteUser = () => {
  const { mutateAsync: inviteUser, isPending: isLoading } = useMutationService<
    InviteUserRequest,
    InviteUserResponse
  >({
    service: authServices.inviteUser,
    options: {
      keys: ["inviteUser"],
      successTitle: "Invitation Sent",
      successMessage: "The invitation has been sent successfully.",
      errorTitle: "Failed to Send Invitation",
      invalidateKeys: ["getInvitations", "admin", "getSchool"],
    },
  });

  return {
    inviteUser,
    isLoading,
  };
};

export const useInvitations = () => {
  return useQueryService<{ role?: string; delta?: number }, GetInvitationsResponse>({
    service: {
      ...authServices.getInvitations,
      data: { role: "admin", delta: 100 },
    },
    options: {
      keys: ["getInvitations", "admin"],
    },
  });
};

export const useSchoolAdmins = () => {
  return useQueryService<object, GetSchoolResponse>({
    service: schoolDynamicEndpoints.getParticularSchool(),
    options: {
      keys: ["getSchool"],
    },
  });
};

export const useResendInvitation = () => {
  const { mutateAsync: resendInvitation, isPending: isResending } = useMutationService<
    { invitationId: number },
    { success?: boolean; message?: string }
  >({
    service: (variables) => authDynamicEndpoints.resendInvitation(variables.invitationId),
    options: {
      successTitle: "Invitation resent",
      successMessage: "The invitation has been resent successfully.",
      errorTitle: "Failed to resend invitation",
      invalidateKeys: ["getInvitations", "admin", "getSchool"],
    },
  });
  return { resendInvitation, isResending };
};

export const useUpdateInvitation = () => {
  const { mutateAsync: updateInvitation, isPending: isUpdating } = useMutationService<
    UpdateInvitationRequest & { invitationId: number },
    { success?: boolean; message?: string }
  >({
    service: (variables) => authDynamicEndpoints.updateInvitation(variables.invitationId),
    options: {
      successTitle: "User updated",
      successMessage: "Admin user details updated successfully.",
      errorTitle: "Failed to update user",
      invalidateKeys: ["getInvitations", "admin", "getSchool"],
    },
  });
  return { updateInvitation, isUpdating };
};

export const useDeleteInvitation = () => {
  const { mutateAsync: deleteInvitation, isPending: isDeleting } = useMutationService<
    { invitationId: number },
    { success?: boolean; message?: string }
  >({
    service: (variables) => authDynamicEndpoints.deleteInvitation(variables.invitationId),
    options: {
      successTitle: "Invitation deleted",
      successMessage: "The invitation has been deleted.",
      errorTitle: "Failed to delete invitation",
      invalidateKeys: ["getInvitations", "admin", "getSchool"],
    },
  });
  return { deleteInvitation, isDeleting };
};

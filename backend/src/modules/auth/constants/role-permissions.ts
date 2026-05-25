
import { UserRole } from "../../shared/entities/EntityEnums";


export enum Action {
    CREATE = "create",
    VIEW = "view",
    UPDATE = "update",
    DELETE = "delete",
}


export enum Resources {
    STAFF = "staff",
    STUDENT = "student",
    PARENT = "parent",
    CLASSROOM = "classroom",
    ANNOUNCEMENT = "announcement",
    PROFILE = "profile",
    ATTENDANCE = "attendance",
    CLASSROOM_ACTIVITY = "classroom-activity",
    INVITATION = "invitation",
    MESSAGING = "messaging",
    NOTIFICATION = "notification",
    SCHOOL = "school",
    ACTIVITY_LOG = "activity-log",
    UPLOAD = "upload",
    ACCOUNT = "account",
    USER_STATS = "user-stats",
    COUNTRY = "country",
    EVENT = "event",
    CURRICULUM = "curriculum",
    ANALYTICS = "analytics",
    ASSESSMENT = "assessment",
};

export interface Permission {
    [key: string]: Action[];
}

const CRUD: Action[] = [
    Action.CREATE,
    Action.VIEW,
    Action.UPDATE,
    Action.DELETE,
];

const READ_ONLY: Action[] = [
    Action.VIEW,
];



export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
    [UserRole.SUPER_ADMIN]: {
        [Resources.STAFF]: CRUD,
        [Resources.STUDENT]: CRUD,
        [Resources.PARENT]: CRUD,
        [Resources.CLASSROOM]: CRUD,
        [Resources.ANNOUNCEMENT]: CRUD,
        [Resources.PROFILE]: CRUD,
        [Resources.ATTENDANCE]: CRUD,
        [Resources.CLASSROOM_ACTIVITY]: CRUD,
        [Resources.INVITATION]: CRUD,
        [Resources.MESSAGING]: CRUD,
        [Resources.NOTIFICATION]: CRUD,
        [Resources.SCHOOL]: CRUD,
        [Resources.ACTIVITY_LOG]: CRUD,
        [Resources.UPLOAD]: CRUD,
        [Resources.USER_STATS]: CRUD,
        [Resources.EVENT]: CRUD,
        [Resources.CURRICULUM]: CRUD,
        [Resources.ANALYTICS]: CRUD,
        [Resources.ASSESSMENT]: CRUD,
    },

    [UserRole.ADMIN]: {
        [Resources.STAFF]: CRUD,
        [Resources.STUDENT]: CRUD,
        [Resources.PARENT]: CRUD,
        [Resources.CLASSROOM]: CRUD,
        [Resources.ANNOUNCEMENT]: CRUD,
        [Resources.PROFILE]: CRUD,
        [Resources.ATTENDANCE]: CRUD,
        [Resources.CLASSROOM_ACTIVITY]: CRUD,
        [Resources.INVITATION]: CRUD,
        [Resources.MESSAGING]: CRUD,
        [Resources.NOTIFICATION]: CRUD,
        [Resources.SCHOOL]: CRUD,
        [Resources.ACTIVITY_LOG]: CRUD,
        [Resources.UPLOAD]: CRUD,
        [Resources.USER_STATS]: CRUD,
        [Resources.EVENT]: CRUD,
        [Resources.CURRICULUM]: CRUD,
        [Resources.ANALYTICS]: CRUD,
        [Resources.ASSESSMENT]: CRUD
    },

    [UserRole.STAFF]: {
        [Resources.STUDENT]: READ_ONLY,
        [Resources.PARENT]: [Action.VIEW, Action.UPDATE],
        [Resources.CLASSROOM]: READ_ONLY,
        [Resources.STAFF]: [Action.VIEW, Action.UPDATE],
        [Resources.ATTENDANCE]: CRUD,
        [Resources.ANNOUNCEMENT]: READ_ONLY,
        [Resources.CLASSROOM_ACTIVITY]: CRUD,
        [Resources.PROFILE]: [Action.VIEW, Action.UPDATE],
        [Resources.MESSAGING]: CRUD,
        [Resources.NOTIFICATION]: READ_ONLY,
        [Resources.SCHOOL]: READ_ONLY,
        [Resources.UPLOAD]: [Action.CREATE, Action.VIEW],
        [Resources.EVENT]: [Action.CREATE, Action.VIEW, Action.UPDATE],
        [Resources.ANALYTICS]: READ_ONLY,
        [Resources.ASSESSMENT]: CRUD
    },

    [UserRole.PARENT]: {
        [Resources.STUDENT]: READ_ONLY,
        [Resources.PARENT]: [Action.VIEW, Action.UPDATE],
        [Resources.CLASSROOM]: READ_ONLY,
        [Resources.ANNOUNCEMENT]: READ_ONLY,
        [Resources.CLASSROOM_ACTIVITY]: READ_ONLY,
        [Resources.PROFILE]: [Action.VIEW, Action.UPDATE],
        [Resources.MESSAGING]: [Action.CREATE, Action.VIEW, Action.UPDATE],
        [Resources.NOTIFICATION]: READ_ONLY,
        [Resources.SCHOOL]: READ_ONLY,
        [Resources.UPLOAD]: [Action.CREATE, Action.VIEW],
        [Resources.EVENT]: READ_ONLY,
        [Resources.ANALYTICS]: READ_ONLY,
    },

    [UserRole.STUDENT]: {
        [Resources.STUDENT]: READ_ONLY,
        [Resources.CLASSROOM]: READ_ONLY,
        [Resources.ANNOUNCEMENT]: READ_ONLY,
        [Resources.CLASSROOM_ACTIVITY]: READ_ONLY,
        [Resources.PROFILE]: [Action.VIEW, Action.UPDATE],
        [Resources.MESSAGING]: [Action.CREATE, Action.VIEW, Action.UPDATE],
        [Resources.NOTIFICATION]: READ_ONLY,
        [Resources.SCHOOL]: READ_ONLY,
        [Resources.UPLOAD]: [Action.CREATE, Action.VIEW],
        [Resources.EVENT]: READ_ONLY,
    },
};

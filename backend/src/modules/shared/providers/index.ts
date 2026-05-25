import {
    adminsProvider,
    announcementsProvider,
    assessmentsProvider,
    classroomsProvider,
    curriculumsProvider,
    milestonesProvider,
    parentsProvider,
    staffProvider,
    studentsProvider,
    subjectsProvider,
} from "./global-search.provider";

export const searchProviders = [
    studentsProvider,
    classroomsProvider,
    staffProvider,
    adminsProvider,
    parentsProvider,
    announcementsProvider,
    curriculumsProvider,
    subjectsProvider,
    milestonesProvider,
    assessmentsProvider,
];

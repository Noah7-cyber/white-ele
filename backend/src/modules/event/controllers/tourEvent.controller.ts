import { validationResult } from "express-validator";
import { tourEventService } from "../services/tourEvent.service";
import {tourAvailabilityService } from "../services/tourAvailability.service";
import { tourQuestionService } from "../services/tourQuestion.service";
import { AppDataSource } from "../../core";
import { TourQuestion } from "../../shared/entities/TourQuestion";
import { TourAvailability } from "../../shared/entities/TourAvailability";
import { Request, Response } from "express";
import { WeekDay } from "../../shared/entities";
import { AuthenticatedRequest } from "../../auth/middleware/middleware";
import { requireSchoolId } from "../../shared/utils/tenant-context";

interface ClientSlot {
  id?: number;
  availabilityId: number;
  date: string;
  startTime: string;
  booked: boolean;
}

export class TourEventCountroller {

     
    // POST students medical info
    async createTourEVent(req: Request, res: Response) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
           
            // Get schoolId from authenticated user
            const authReq = req as AuthenticatedRequest;
            const schoolId = requireSchoolId(authReq);

            const result = await AppDataSource.transaction(async (manager) => {
                const { basicInfo, availability, notification, questions} = req.body;
                const tourData = {
                    ...basicInfo,
                    ...notification,
                    schoolId,
                }
                const tourRecord = await tourEventService.createTourEvent(tourData, { manager });

                if ("error" in tourRecord) {
                    // Throw error to be caught by outer try-catch
                    throw new Error(tourRecord.message);
                }

                //Store AvAILABILITY
                const availabilityRecords = await Promise.all(
                    (availability as Partial<TourAvailability>[]).map( async (slot) => {
                        
                        return await tourAvailabilityService.createTourAvailabilty({
                            tourEventId: tourRecord.id,
                            schoolId,
                            ...slot
                        }, { manager })


                    })
                )

                // Store Questions
                let questionRecords: any[] = [];
                if (Array.isArray(questions) && questions.length > 0) {
                    questionRecords = await Promise.all(
                        (questions as Partial<TourQuestion>[]).map((q: any) =>
                            tourQuestionService.createTourQuestion(
                                {
                                    tourEvent: tourRecord,
                                    schoolId,
                                    ...q,
                                },
                                { manager }
                            )
                        )
                    );
                }


                return{
                    tourEvent: tourRecord,
                    availability: availabilityRecords,
                    questions: questionRecords
                }
            })
            
            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message || "Internal server error" });
        }
    }


    // GET /Tour Events
    async getAllEvents(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
              return res.status(400).json({ success: false, errors: errors.array() });
            }
            
            // Get schoolId from authenticated user
            const authReq = req as AuthenticatedRequest;
            const schoolId = requireSchoolId(authReq);
            
            const {pos: posQuery, delta: deltaQuery, search, day, startTime, endTime} = req.query;
            const pos = posQuery ? parseInt(posQuery as string, 10) : 0;
          const delta = deltaQuery ? parseInt(deltaQuery as string, 10) : 10;
          
    
          const filters = {
            pos,
            delta,
            search: search as string | undefined,
            day: day as WeekDay | undefined,
            startTime: startTime as string | undefined,
            endTime: endTime as string | undefined,
            schoolId,
          };
          const events = await tourEventService.getAllTourEvents(filters);
          return res.json(events);
        } catch (error: any) {
          return res.status(500).json({ success: false, message: "Internal server error" } );
        }
    }

    //Get /tour event by id
    async getEventById(req: Request, res: Response) {
        try {
            const idParam = req.params['id'];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "Tour Event ID is required" });
            }
            const id = parseInt(idParam, 10);

            const event = await tourEventService.getTourEventById(id);
            if (!event) {
                return res.status(404).json({ success: false, message: "Tour Event not found" });
            }
            return res.json({ success: true, data: event });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal server error" } );
        }

    }

    async clientGetTourEventById(req: Request, res: Response) {
    try {
      const id = Number(req.params["id"]);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour event ID" });
      }

      const tourEvent = await tourEventService.clientGetTourEventById(id);

      if (!tourEvent) {
        return res.status(404).json({ error: "Tour event not found" });
      }

      // Slots are already filtered in the service, so we just return the object

      const result = {
        id: tourEvent?.id,
        title: tourEvent?.title,
        description: tourEvent?.description,
        url: tourEvent?.url,
        duration: tourEvent?.duration,
        location: tourEvent?.location,
        beforeTour: tourEvent?.beforeTour,
        afterTour: tourEvent?.afterTour,
        minimumNotice: tourEvent?.minimumNotice,
        minimumNoticeUnit: tourEvent?.minimumNoticeUnit,
        limitTotalTourDuration: tourEvent?.limitTotalTourDuration,
        timeSlotInterval: tourEvent?.timeSlotInterval,
        status: tourEvent?.status,
        limitNumberOfUpcomingTours: tourEvent?.limitNumberOfUpcomingTours,
        createdAt: tourEvent?.createdAt,
        updatedAt: tourEvent?.updatedAt,
        availability: tourEvent?.availability?.map(av => ({
          id: av?.id,
          tourEventId: av?.tourEventId,
          day: av?.day,
          startHour: av?.startHour,
          startMinute: av?.startMinute,
          startMeridiem: av?.startMeridiem,
          endHour: av?.endHour,
          endMinute: av?.endMinute,
          endMeridiem: av?.endMeridiem,
          startTime: av?.startTime,
          endTime: av?.endTime,
          createdAt: av?.createdAt,
          updatedAt: av?.updatedAt,
          slots: (av?.slots as unknown as ClientSlot[])?.map((sl: ClientSlot) => ({
            id: sl?.id,
            availabilityId: sl?.availabilityId,
            date: sl?.date,
            startTime: sl?.startTime,
            booked: sl?.booked
          })) ?? []
        })) ?? [],
        tourQuestions: tourEvent?.tourQuestions?.map(q => ({
          id: q?.id,
          inputType: q?.inputType,
          label: q?.label,
          placeHolder: q?.placeHolder,
          isRequired: q?.isRequired,
          createdAt: q?.createdAt,
          updatedAt: q?.updatedAt
        })) ?? []
      };

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch tour event" });
    }
  }

  //DELETE /tour event by id
    async deleteTourEventById(req: Request, res: Response) {
        try {
            const idParam = req.params['id'];
            if (!idParam) {
                return res.status(400).json({ success: false, message: "Tour Event ID is required" });
            }
            const id = parseInt(idParam, 10);

            const event = await tourEventService.getTourEventById(id);
            if (!event) {
                return res.status(404).json({ success: false, message: "Tour Event not found" });
            }
            await tourEventService.deleteTourEventById(id);
            return res.json({ success: true, message: "Tour Event deleted successfully" });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal server error" } );
        }
    }
}
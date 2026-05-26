/* eslint-disable @typescript-eslint/no-explicit-any */
 

import * as Yup from "yup";

export interface AnnouncementProps {
  title: string;
  content: Record<string, any>;
}

export const initialValue: AnnouncementProps = {
  title: "",
  content: {},
};

export const validationSchema = Yup.object().shape({
  title: Yup.string().required("Announcement title is required"),
  content: Yup.mixed()
    .required("Announcement content is required")
    .test("editorjs-has-blocks", "Announcement content is required", (value: any) => {
      return Array.isArray(value?.blocks) && value.blocks.length > 0;
    }),
});

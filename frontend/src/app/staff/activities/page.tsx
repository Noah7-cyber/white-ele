import ActivitiesPage from '@/modules/staff/page/Activities/activitiesPage'
import React from 'react'
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activities",
};

const page = () => {
  return (
    <ActivitiesPage/>
  )
}

export default page
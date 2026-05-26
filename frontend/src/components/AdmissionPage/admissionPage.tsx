export const Calendar = () => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dates = [
    { day: 28, events: [] },
    { day: 29, events: [] },
    { day: 30, events: [] },
    { day: 31, events: [] },
    { day: 1, events: [] },
    { day: 2, events: ['Students Day', 'Teacher Pro...', 'AP Calculus...', 'Spring Conc...'] },
    { day: 3, events: [] },
    { day: 4, events: [] },
    { day: 5, events: ['Cinco de Ma...'] },
    { day: 6, events: [] },
    { day: 7, events: [] },
    { day: 8, events: ['Science Fair...', 'Teacher Mee...'] },
    { day: 9, events: ['Science Fair...'] },
    { day: 10, events: ['PTA Meeting'] },
    { day: 11, events: [] },
    { day: 12, events: ['English Liter...'] },
    { day: 13, events: [] },
    { day: 14, events: [] },
    { day: 15, events: ['Varsity Trac...'] },
    { day: 16, events: ['Junior Prom'] },
    { day: 17, events: [] },
    { day: 18, events: [] },
    { day: 19, events: ['Senior Proje...', 'Teacher Mee...'] },
    { day: 20, events: [] },
    { day: 21, events: ['English Liter...'] },
    { day: 22, events: ['Art Exhibito...'] },
    { day: 23, events: ['Drama Club...'] },
    { day: 24, events: ['PTA Meeting'] },
  ];

  return (
    <div className="p-5">
      <div className="flex justify-between mb-5">
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-indigo-100 border border-gray-300 rounded">Month</button>
          <button className="px-3 py-1 bg-indigo-100 border border-gray-300 rounded">Week</button>
          <button className="px-3 py-1 bg-indigo-100 border border-gray-300 rounded">Day</button>
        </div>
        <button className="px-3 py-1 bg-yellow-300 text-white rounded">Create Tour Event</button>
      </div>
      <div className="flex">
        <div className="w-3/4">
          <div className="grid grid-cols-7 bg-green-500 text-white p-2">
            {days.map((day) => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 bg-gray-300">
            {dates.map((date, index) => (
              <div key={index} className="bg-white p-2 min-h-[100px]">
                <div className="font-bold">{date.day}</div>
                {date.events.length > 0 && (
                  <div className="mt-1">
                    {date.events.slice(0, 2).map((event, i) => (
                      <div key={i} className="text-sm text-green-700">
                        {event}
                      </div>
                    ))}
                    {date.events.length > 2 && (
                      <div className="text-xs text-gray-500">{date.events.length - 2} more</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/4 ml-5 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold">Today’s Tour Schedule</h3>
          <p className="text-gray-500">No tours scheduled</p>
          <button className="mt-2 w-full bg-green-500 text-white py-1 rounded">
            Schedule Tour
          </button>
        </div>
      </div>
    </div>
  );
};

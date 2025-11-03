import { GetPlaceDetails, PHOTO_REF_URL } from '@/service/GlobalApi';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Wallet } from "lucide-react"; // If lucide-react installed

function UserTripCardItem({ trip }) {
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (trip) GetPlacePhoto();
    // eslint-disable-next-line
  }, [trip]);

  const GetPlacePhoto = async () => {
    try {
      const data = { textQuery: trip?.userSelection?.location?.label };
      const resp = await GetPlaceDetails(data);
      const photoName = resp.data.places?.[0]?.photos?.[3]?.name;

      if (photoName) {
        const PhotoUrl = PHOTO_REF_URL.replace('{NAME}', photoName);
        setPhotoUrl(PhotoUrl);
      }
    } catch (err) {
      console.log("Error fetching image");
    }
  };

  const location = trip?.userSelection?.location?.label;
  const days = trip?.userSelection?.noOfDays;
  const budget = trip?.userSelection?.budget;

  return (
    <Link to={`/view-trip/${trip?.id}`}>
      <div className="group w-full cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {/* Image */}
        <div className="relative h-44 w-full overflow-hidden rounded-t-2xl">
          <img
            src={photoUrl || "/placeholder.jpg"}
            alt={location}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          
          <div className="absolute bottom-2 left-3 text-white drop-shadow-md">
            <h2 className="font-semibold text-lg truncate">{location}</h2>
          </div>
        </div>

        {/* Card Info */}
        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {days} Days
            </span>

            <span className="flex items-center gap-1">
              <Wallet className="w-4 h-4" /> {budget}
            </span>
          </div>

          <p className="text-xs text-gray-400 line-clamp-2">
            Click to view itinerary →
          </p>
        </div>
      </div>
    </Link>
  );
}

export default UserTripCardItem;

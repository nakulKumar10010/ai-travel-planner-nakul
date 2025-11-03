import { Input } from "@/components/ui/input";
import {
  AI_PROMPT,
  SelectBudgetOptions,
  SelectTravelList,
} from "@/constants/options";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateTrip } from "@/service/AIModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/service/firebaseConfig";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

// NEW: official async loader instead of direct script tag
import { Loader } from "@googlemaps/js-api-loader";

function CreateTrip() {
  const [formData, setFormData] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placeLabel, setPlaceLabel] = useState("");

  const navigate = useNavigate();

  // container where we’ll mount the PlaceAutocompleteElement
  const pacContainerRef = useRef(null);
  const pacRef = useRef(null); // keep instance to clean up

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Load Maps JS + Places (new) once
    let isMounted = true;

    const initPlaces = async () => {
      try {
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_PLACE_API_KEY,
          version: "weekly",
          libraries: ["places"],
        });
        await loader.importLibrary("places");

        if (!isMounted || !pacContainerRef.current) return;

        // Create the new widget
        // https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
        // https://developers.google.com/maps/documentation/javascript/examples/place-autocomplete-element
        // @ts-ignore - class is provided by Maps JS
        const el = new google.maps.places.PlaceAutocompleteElement({
          // Optional: narrow to India, etc.
          includedRegionCodes: ["in"],
          // includedPrimaryTypes: ['geocode', 'establishment'],
        });

        // Listen for selection
        // Event is 'gmp-select'; it provides { placePrediction }
        el.addEventListener("gmp-select", async ({ placePrediction }) => {
          const place = placePrediction.toPlace();
          // Ask only for what you need
          await place.fetchFields({
            fields: ["displayName", "formattedAddress", "id", "location"],
          });

          const label = place.displayName || place.formattedAddress || "";
          setPlaceLabel(label);

          // store a minimal, serializable “location” in your formData
          handleInputChange("location", {
            label,
            placeId: place.id,
            location: place.location
              ? { lat: place.location.lat(), lng: place.location.lng() }
              : null,
          });
        });

        pacContainerRef.current.innerHTML = ""; // in case of hot reloads
        pacContainerRef.current.appendChild(el);
        pacRef.current = el;
      } catch (err) {
        console.error("Failed to init Places Autocomplete:", err);
        toast("Failed to load Google Places. Check API key and enabled APIs.");
      }
    };

    initPlaces();

    return () => {
      isMounted = false;
      // Clean up the element
      if (pacRef.current && pacRef.current.remove) {
        pacRef.current.remove();
      }
    };
  }, []);

  const onGenerateTrip = async () => {
    const user = localStorage.getItem("user");
    if (!user) {
      setOpenDialog(true);
      return;
    }

    // BUGFIX: was formData?.noOfDAys ; use noOfDays everywhere
    if (
      Number(formData?.noOfDays) > 5 || // keep your 5-day cap if intentional
      !formData?.location ||
      !formData?.budget ||
      !formData?.traveler
    ) {
      toast("Please fill all the details");
      return;
    }

    try {
      setLoading(true);

      const FINAL_PROMPT = AI_PROMPT.replace(
        "{location}",
        formData?.location?.label || placeLabel
      )
        .replaceAll("{totalDays}", String(formData?.noOfDays))
        .replace("{traveler}", formData?.traveler)
        .replaceAll("{budget}", formData?.budget);

      const tripJson = await generateTrip(FINAL_PROMPT); // <- returns parsed JSON
      setLoading(false);
      SaveAiTrip(tripJson);
    } catch (e) {
      console.error(e);
      setLoading(false);
      toast("Something went wrong while generating your itinerary.");
    }
  };

  const SaveAiTrip = async (TripData) => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      const docId = Date.now().toString();

      await setDoc(doc(db, "AITrips", docId), {
        userSelection: formData,
        tripData: TripData,
        userEmail: user?.email,
        id: docId,
      });

      setLoading(false);
      navigate("/view-trip/" + docId);
    } catch (e) {
      console.error(e);
      setLoading(false);
      toast("Failed to save your trip.");
    }
  };

  const login = useGoogleLogin({
    onSuccess: (res) => GetUserProfile(res),
    onError: (error) => console.log(error),
  });

  const GetUserProfile = (tokenInfo) => {
    axios
      .get(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo.access_token}`,
        {
          headers: {
            Authorization: `Bearer ${tokenInfo.access_token}`,
            Accept: "application/json",
          },
        }
      )
      .then((resp) => {
        localStorage.setItem("user", JSON.stringify(resp.data));
        setOpenDialog(false);
        onGenerateTrip();
      })
      .catch((error) => {
        console.error("Error fetching user profile: ", error);
      });
  };

  return (
    <div className="sm:px-10 md:px-32 lg:px-56 px-5 mt-10">
      <h2 className="font-bold text-3xl">
        Tell us your travel preferences🏕️🌴
      </h2>
      <p className="mt-3 text-gray-500 text-xl">
        Just provide some basic information, and our trip planner will generate
        a customized itinerary based on your preferences.
      </p>

      <div className="mt-20 flex flex-col gap-10">
        <div>
          <h2 className="text-xl my-3 font-medium  ">
            What is destination of choice?
          </h2>

          {/* NEW: Google Place Autocomplete Element mounts here */}
          <div
            ref={pacContainerRef}
            className="w-full [&>gmp-place-autocomplete]:w-full"
          />
          
          {placeLabel ? (
            <p className="text-sm text-gray-500 mt-2">Selected: {placeLabel}</p>
          ) : null}
        </div>

        <div>
          <h2 className="text-xl my-3 font-medium">
            How many days are you planning your trip?
          </h2>
          <Input
            placeholder={"Ex.4"}
            type="number"
            min={1}
            onChange={(e) => handleInputChange("noOfDays", e.target.value)}
          />
        </div>

        <div>
          <h2 className="text-xl my-3 font-medium">What is Your Budget?</h2>
          <div className="grid grid-cols-3 gap-5 mt-5">
            {SelectBudgetOptions.map((item, index) => (
              <div
                key={index}
                onClick={() => handleInputChange("budget", item.title)}
                className={`p-4 border cursor-pointer rounded-lg hover:shadow-lg ${
                  formData?.budget === item.title && "shadow-lg border-black"
                }`}
              >
                <h2 className="text-4xl">{item.icon}</h2>
                <h2 className="font-bold text-lg">{item.title}</h2>
                <h2 className="text-sm text-gray-500">{item.desc}</h2>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl my-3 font-medium">
            Who do you plan on traveling with on your next adventure?
          </h2>
          <div className="grid grid-cols-3 gap-5 mt-5">
            {SelectTravelList.map((item, index) => (
              <div
                key={index}
                onClick={() => handleInputChange("traveler", item.people)}
                className={`p-4 border cursor-pointer rounded-lg hover:shadow-lg ${
                  formData?.traveler === item.people && "shadow-lg border-black"
                }`}
              >
                <h2 className="text-4xl">{item.icon}</h2>
                <h2 className="font-bold text-lg">{item.title}</h2>
                <h2 className="text-sm text-gray-500">{item.desc}</h2>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="my-10 justify-end flex">
        <Button disabled={loading} onClick={onGenerateTrip}>
          {loading ? (
            <AiOutlineLoading3Quarters className="h-7 w-7 animate-spin" />
          ) : (
            "Generate Trip"
          )}
        </Button>
      </div>

      <Dialog open={openDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogDescription>
              <img
                src="/logo.svg"
                alt="logo"
                width="100px"
                className="items-center"
              />
              <h2 className="font-bold text-lg">
                Sign In to check out your travel plan
              </h2>
              <p>Sign in to the App with Google authentication securely</p>
              <Button
                onClick={login}
                className="w-full mt-6 flex gap-4 items-center"
              >
                <FcGoogle className="h-7 w-7" />
                Sign in With Google
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CreateTrip;

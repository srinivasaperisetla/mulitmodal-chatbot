import React, { useEffect, useState } from "react";
import { handleLogout, LogoutStateType } from "@/app/(auth)/actions";
import { LogOutIcon } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

const LogoutButton = () => {
 
  const handleSubmit = () => {
    handleLogout();
    toast.success("Logout successful");
  };

  return (
    <div>
      <Button
        onClick={handleSubmit}
        className="flex items-center gap-2 text-white"
      >
         <LogOutIcon /> <p>Log out</p>
      </Button>
    </div>
  );
};

export default LogoutButton;

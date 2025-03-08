import { handleLogout } from "@/app/(auth)/actions";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";

const LogoutButton = () => {
  const handleSubmit = () => {
    handleLogout();
    toast.success("Logout successful");
  };

  return (
    <div onClick={handleSubmit} className="flex items-center gap-2 text-black">
      <LogOutIcon className="text-[18px]" /> <p>Log out</p>
    </div>
  );
};

export default LogoutButton;

import React from "react";
import LogoutButton from "./LogoutButton";
import { useSidebar } from "./ui/sidebar";
import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import { PanelBottom } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MdManageAccounts } from "react-icons/md";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { useSession } from "next-auth/react";

const SidebarSec = () => {
  const { toggleSidebar } = useSidebar();
  const { data: session, status, update } = useSession();

  return (
    <Sidebar collapsible="offcanvas" className=" bg-black text-white px-4 py-5">
      <SidebarContent className="bg-black">
        <SidebarGroup className="">
          <div
            onClick={toggleSidebar}
            className="flex items-center justify-center cursor-pointer bg-transparent rounded-sm h-8 w-8"
          >
            <PanelBottom className="text-white text-[30px] size-full rotate-90" />
          </div>
        </SidebarGroup>
        <SidebarGroup>
          <h3>Recent</h3>
        </SidebarGroup>
        <SidebarGroup className="overflow-y-auto">
          <p className="text-sm">Who is Elon Musk?</p>
        </SidebarGroup>
      </SidebarContent>

      <div className="bg-black">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-5 hover:bg-transparent hover:text-white focus:outline-none">
            {/* <SidebarMenuButton className="flex items-center justify-between "> */}
            <span>Account</span>
            <MdManageAccounts className="w-7 h-7" />
            {/* </SidebarMenuButton> */}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width] py-4 "
          >
            <DropdownMenuItem asChild className=" w-full p-3">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full text-left hover:bg-[#f0f0f0] py-[6px] rounded-sm px-3">
                    Profile
                  </button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[425px]">
                  <DialogTitle>
                    <VisuallyHidden>Profile</VisuallyHidden>
                  </DialogTitle>

                  <DialogHeader>
                    <DialogTitle>Profile</DialogTitle>
                    <DialogDescription>Information</DialogDescription>
                  </DialogHeader>

                  <div className="flex items-center gap-6">
                    <h4>Email:</h4>
                    <p>{session?.user?.email ?? "Not Available"}</p>
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Sidebar>
  );
};

export default SidebarSec;

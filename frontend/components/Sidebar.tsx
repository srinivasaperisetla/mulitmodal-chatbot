import React from "react";
import LogoutButton from "./LogoutButton";
import { SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "./ui/sidebar";
import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar"
import { Plus } from "lucide-react";

const SidebarSec = () => {
  const { toggleSidebar } = useSidebar();
  
  return (
    <div className=' bg-[#080808] w-[16em] h-full inline-flex flex-col justify-between py-10 px-4'>

        <div className='text-white '>
          <h3>Recent</h3>
        </div>

    <LogoutButton/>
    </div>

    // I want to add the collapsible sidebar here


    //   <Sidebar collapsible="offcanvas" className='bg-[#080808] text-black w-[16em] h-full inline-flex flex-col justify-between py-10 '>
    //   <SidebarContent>
    //   <SidebarGroup>
    //     <SidebarGroupLabel>Recent</SidebarGroupLabel>
    //     <SidebarGroupAction>
    //       <p>Who is Elon Musk?</p>
    //     </SidebarGroupAction>
    //   </SidebarGroup>
    //   </SidebarContent>
    // </Sidebar>
  );
};

export default SidebarSec;

import CloudScale from "../../assets/images/cloudscale_img.png";
import Nexgen from "../../assets/images/nexgen_img.webp";
import Skyline from "../../assets/images/skyline_img.jpg";
import Everbloom from "../../assets/images/everbloom_img.png";

const tenants = [
  {
    id: 1,
    orgName: "NexGen Systems",
    email: "contact@nexgen.io",
    logo: Nexgen,
    plan: "Enterprise",
    status: "Active",
    trialEndDate: "N/A",
    createdAt: "Jav 12, 2024"
  },
  
  {
    id: 2,
    orgName: "SkylineMedia",
    email: "billing@skylinemedia.com",
    logo: Skyline,
    plan: "Pro",
    status: "Trial",
    trialEndDate: "Mar 28, 2024",
    createdAt: "Mar 14, 2024"
  }, {
    id: 3,
    orgName: "Everbloom Events",
    email: "admin@everbloom.org",
    logo: Everbloom,
    plan: "Pro",
    status: "Suspented",
    trialEndDate: "Expired",
    createdAt: "Dec 05, 2023"
  },
   {
    id: 4,
    orgName: "CloudScale Solutions",
    email: "ops@cloudscale.net",
    logo: CloudScale,
    plan: "Enterprise",
    status: "Active",
    trialEndDate: "N/A",
    createdAt: "Feb 22, 2024"
  }
]

export default tenants;
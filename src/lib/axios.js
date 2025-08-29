import axios from "axios";
// import { toast } from "@/components/ui/use-toast";

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});


// Response interceptor
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const message =
//       error.response?.data?.message || "Something went wrong. Please try again.";

//     toast({
//       variant: "destructive",
//       title: "Error",
//       description: message,
//     });

//     return Promise.reject(error);
//   }
// );

export default api;

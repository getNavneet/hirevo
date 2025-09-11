// import InterviewRoom from "../components/InterviewRoom/InterviewRoom";
import InterviewRoom from "../components/InterviewRoom.jsx";
// import InterviewRoom from "../components/InterviewRoom";
import { useInterviewStore } from "../store/interview.store";
function InterviewRoomPage() {
const { selectedLevel,currentStep } = useInterviewStore();
  return (
    <div>
      {console.log(selectedLevel)}
      {console.log(currentStep)}
   <InterviewRoom/>
     
    </div>
  );
}

export default InterviewRoomPage;

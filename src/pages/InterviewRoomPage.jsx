import InterviewRoom from "../components/InterviewRoom/InterviewRoom";
import { useInterviewStore } from "../store/interview.store";
function InterviewRoomPage() {
const { selectedLevel } = useInterviewStore();

  return (
    <div>
      {selectedLevel === "interview" && <InterviewRoom/>}
     
    </div>
  );
}

export default InterviewRoomPage;

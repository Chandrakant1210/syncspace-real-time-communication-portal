import Layout from "../components/Layout";
import Whiteboard from "../components/Whiteboard";

function WhiteboardPage() {
  return (
    <Layout>
      <div className="animate-fade-up">
        <Whiteboard />
      </div>
    </Layout>
  );
}

export default WhiteboardPage;
import styled from "styled-components";

const Section = styled.section`
  background-color: #071621;
  padding: 3rem 1rem;
  text-align: center;
  border-bottom: 1px solid #1cc7d1;
`;

const Title = styled.h2`
  font-size: 2rem;
  color: #15d4bc;
  margin-bottom: 2rem;
`;

const List = styled.ul`
  max-width: 700px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
`;

const Item = styled.li`
  background-color: #0b1d2c;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border-left: 5px solid
    ${(props) =>
      props.status === "done"
        ? "#28e4b8"
        : props.status === "in-progress"
        ? "#ffcc00"
        : "#1cc7d1"};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  }

  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #e0f7fa;
  font-size: 1rem;
  text-align: left;
  word-break: break-word;
`;

const Icon = styled.span`
  font-size: 1.5rem;
  line-height: 1;
`;

const Legend = styled.div`
  max-width: 700px;
  margin: 0 auto 1.5rem;
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  color: #a8d8d8;
  font-size: 1rem;
`;

const FeaturesList = () => {
  const features = [
    { name: "Share any YouTube video to SafeTube", status: "done" },
    { name: "Parent & child user authentication", status: "in-progress" },
    {
      name: "SafeTube automatically downloads and stores shared videos in your library.",
      status: "done",
    },
    {
      name: "Automatic retrieval of video title, thumbnail, and other details",
      status: "done",
    },

    { name: "Private dashboard for parents", status: "in-progress" },
    { name: "Watch-time limits and scheduling", status: "planned" },
    { name: "Only parent-approved videos for kids", status: "planned" },
    { name: "Ad-free, safe viewing experience", status: "planned" },
    { name: "Notifications and reminders", status: "planned" },
    { name: "Social sharing features", status: "planned" },
  ];

  return (
    <Section>
      <Title>Planned Features & Progress</Title>
      <Legend>
        <span>✅ Done</span>
        <span>🛠️ In Progress</span>
        <span>🔜 Planned</span>
      </Legend>

      <List>
        {features.map((feature, index) => (
          <Item key={index} status={feature.status}>
            <Icon>
              {feature.status === "done"
                ? "✅"
                : feature.status === "in-progress"
                ? "🛠️"
                : "🔜"}
            </Icon>
            {feature.name}
          </Item>
        ))}
      </List>
    </Section>
  );
};

export default FeaturesList;

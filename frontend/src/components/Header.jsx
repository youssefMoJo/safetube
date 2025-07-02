import styled from "styled-components";
import logo from "../assets/Jlogo.png";

const HeaderContainer = styled.header`
  background: linear-gradient(90deg, #0b1d2c 0%, #071621 100%);
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-bottom: 2px solid #1cc7d1;

  @media (min-width: 600px) {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Logo = styled.img`
  height: 55px;
`;

const AppName = styled.h1`
  font-size: 2.2rem;
  color: #15d4bc;
  font-weight: bold;
  margin: 0;
`;

const Tagline = styled.p`
  font-size: 1rem;
  color: #e0f7fa;
  margin-top: 0.5rem;
  max-width: 300px;

  @media (min-width: 600px) {
    margin-top: 0;
    margin-left: 1rem;
    border-left: 2px solid #1cc7d1;
    padding-left: 1rem;
  }
`;

const Header = () => {
  return (
    <HeaderContainer>
      <LogoRow>
        <Logo src={logo} alt="SafeTube Logo" />
        <AppName>SafeTube</AppName>
      </LogoRow>
      <Tagline>Parent-controlled. Kid-friendly. Ad-free.</Tagline>
    </HeaderContainer>
  );
};

export default Header;

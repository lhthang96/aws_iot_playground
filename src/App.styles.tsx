import styled from 'styled-components';

export const StyledContainer = styled.div`
  width: 100%;
  height: 100vh;
  padding: 20px;
  display: flex;
  background: #c3e0ea;

  .sidebar {
    width: 400px;
    height: 100%;

    .iot-connection-status {
      width: 100%;
      height: fit-content;
      margin-bottom: 40px;
    }

    .scenario-picker {
      flex: 1;
      overflow: hidden auto;
      display: flex;
      flex-direction: column;

      .scenario-btn {
        margin-bottom: 16px;
      }
    }
  }

  .content {
    flex: 1;
    padding: 0 20px;
  }
`;

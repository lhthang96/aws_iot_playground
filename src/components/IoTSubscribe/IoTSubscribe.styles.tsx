import styled from 'styled-components';

export const StyledIoTSubscribe = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-shadow: 0 0 4px 1px rgba(0, 0, 0, 0.2);

  .subscribe-input {
    width: 100%;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    .subscribe-input-field {
      flex: 1;
    }
    .subscribe-input-btn {
      margin-left: 8px;
    }
  }

  .subscribe-log {
    flex: 1;
    width: 100%;
    box-shadow: inset 0 0 4px 1px rgba(0, 0, 0, 0.2);
    overflow: hidden auto;
  }
`;

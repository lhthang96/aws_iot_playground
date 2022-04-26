import React from 'react';
import { render } from 'react-dom';
import { App } from './App';
import './index.css';
require('babel-polyfill');

render(<App />, document.getElementById('app'));

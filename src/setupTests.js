// Polyfill TextEncoder/TextDecoder for jsdom (required by react-router v7)
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

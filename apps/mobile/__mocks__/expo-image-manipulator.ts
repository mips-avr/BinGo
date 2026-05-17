export const SaveFormat = { JPEG: 'jpeg', PNG: 'png' };

export const manipulateAsync = jest.fn(async (uri: string) => ({
  uri,
  width: 32,
  height: 32,
  base64: 'YWFhYWFhYWFhYWFh',
}));

#pragma once
#ifndef SCREEN_H
#define SCREEN_H

#include <napi.h>

class CaptureWorker : public Napi::AsyncWorker
{
public:
  CaptureWorker(Napi::Function &cb);
  CaptureWorker(int x, int y, int w, int h, Napi::Function &cb);
  void Execute();
  void OnOK();
  int x;
  int y;
  int w;
  int h;
  Napi::Function *cb;

private:
  uint8_t *buffer;
  int height;
  int width;
  size_t bytesPerRow;
  uint8_t bytesPerPixel;
#if defined(__MACH__)
  CFDataRef dataRef;
  CGImageRef imageRef;
  CFIndex length;
#endif
};

#endif // SCREEN_H
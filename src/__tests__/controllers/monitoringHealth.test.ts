import { Request, Response } from "express";

import monitoringHealth from "../../controllers/healthMonitoring";

describe("monitoringHealth controller", () => {
  let req: Request;
  let res: Response;

  beforeEach(() => {
    req = {} as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  it("should return 200 status code and a healthy status", async () => {
    await monitoringHealth(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

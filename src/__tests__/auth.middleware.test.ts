import { Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as jwtUtils from "../utils/jwt";

describe("Auth Middleware - authenticate", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("should return 401 if no token is provided", () => {
    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "No token provided",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should set req.userId and req.userRole and call next for valid token", () => {
    mockReq.headers = { authorization: "Bearer valid_token" };
    jest.spyOn(jwtUtils, "verifyToken").mockReturnValue({ id: "user_123", role: "admin" });

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.userId).toBe("user_123");
    expect(mockReq.userRole).toBe("admin");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should return 401 for an invalid or expired token", () => {
    mockReq.headers = { authorization: "Bearer invalid_token" };
    jest.spyOn(jwtUtils, "verifyToken").mockImplementation(() => {
      throw new Error("Invalid token");
    });

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid or expired token",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

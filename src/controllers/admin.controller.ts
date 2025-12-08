import { Request, Response } from 'express';
import { setConfig } from '../services/config.service';
import User from '../models/user.model';
import Ride from '../models/ride.model';
import SupportTicket from '../models/support.model';
import DriverLocation from '../models/driver-location.model';
import Notification from '../models/notification.model';
import PricingRule from '../models/pricingRule.model';
import Config from '../models/config.model'; // Import the Config model
import { Sequelize } from 'sequelize';
import { GoogleGenerativeAI, GenerateContentRequest } from '@google/generative-ai';
import { sendAdminNotification } from '../services/notification.service';


// --- AI ASSISTANT --- //
export const getAIAssistantResponse = async (req: Request, res: Response) => {
    try {
        const { prompt, history, userData, fileBase64, mimeType } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                text: "AI Assistant is disabled on the server. Please configure the GEMINI_API_KEY.",
                action: { type: 'NONE' }
            });
        }

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        const simplifiedData = userData.map((u: any) => ({
            id: u.id,
            role: u.role,
            city: u.city,
            state: u.state,
            earnings: u.earnings,
            revenue: u.revenue,
            bookings: u.bookings,
            penalty: u.penalty,
            status: u.status,
            signupDate: u.signupDate
        }));

        const systemInstructionText = `
          You are the intelligent AI Admin Assistant for 'Spark'.
          You must return a JSON object. Do NOT wrap it in markdown blocks. Just raw JSON.
          Structure:
          {
            "text": "Your conversational response here.",
            "action": {
              "type": "BLOCK_USERS" | "UNBLOCK_USERS" | "GENERATE_CHART" | "NAVIGATE" | "UPDATE_PRICING" | "NONE",
              "targetIds": ["id1", "id2"],
              "page": "Analytics" | "Drivers",
              "chartData": { ... },
              "pricingData": { ... }
            }
          }
          Current Date: ${new Date().toISOString().split('T')[0]}
          Current App Data: ${JSON.stringify(simplifiedData.slice(0, 100))}
        `;

        const historyContents = history.map((msg: any) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const currentParts: any[] = [{ text: prompt }];
        if (fileBase64 && mimeType) {
            currentParts.push({
                inlineData: {
                    data: fileBase64,
                    mimeType: mimeType
                }
            });
        }

        const contents = [
            { role: 'user', parts: [{ text: systemInstructionText }] }, // Prepend system instruction as a user message
            ...historyContents,
            { role: 'user', parts: currentParts }
        ];

        const request: GenerateContentRequest = {
            contents: contents,
            // Removed systemInstruction from here as it's not part of GenerateContentRequest
        };
        
        const result = await model.generateContent(request);
        const responseText = result.response.text();
        if (!responseText) throw new Error("Empty response from AI");

        res.status(200).json(JSON.parse(responseText));

    } catch (error: any) {
        console.error("Error in AI Assistant backend:", error);
        res.status(500).json({
            text: `An error occurred on the server while processing your request: ${error.message}`,
            action: { type: 'NONE' }
        });
    }
};


export const addPricingRule = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const ruleData = req.body;

    const newRule = await PricingRule.create({ ...ruleData, category: type });

    res.status(201).json({ message: `'${type}' pricing rule added successfully.`, rule: newRule });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add pricing rule.', message: error.message });
  }
};

export const deletePricingRule = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    const rule = await PricingRule.findOne({ where: { id, category: type } });

    if (!rule) {
      return res.status(404).json({ error: `Pricing rule with ID ${id} and category '${type}' not found.` });
    }

    await rule.destroy();
    res.status(200).json({ message: `'${type}' pricing rule ${id} deleted successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete pricing rule.', message: error.message });
  }
};


export const sendNotification = async (req: Request, res: Response) => {
    try {
        const { title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required.' });
        }

        // Fetch all users to send them a notification
        const users = await User.findAll({ attributes: ['id'] });
        
        if (!users.length) {
            return res.status(404).json({ message: 'No users found to send notification to.' });
        }

        // Create a notification for each user
        const notifications = users.map(user => ({
            title,
            message,
            type: 'general' as const,
            userId: user.id,
        }));

        // Use bulkCreate for efficiency
        await Notification.bulkCreate(notifications);

        res.status(200).json({ message: `Notification sent successfully to ${users.length} users.` });

    } catch (error: any) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: 'Failed to send notification.', message: error.message });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, phoneNumber, email, userType } = req.body;

        if (!firstName || !lastName || !phoneNumber || !userType) {
            return res.status(400).json({ message: 'First name, last name, phone number, and user type are required.' });
        }

        const newUser = await User.create({
            firstName,
            lastName,
            phoneNumber,
            email,
            userType,
        });

        res.status(201).json(newUser);
    } catch (error: any) {
        console.error('Error creating user:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'A user with this phone number or email already exists.', message: error.message });
        }
        res.status(500).json({ error: 'Failed to create user.', message: error.message });
    }
};


export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['pfp'] },
      raw: true,
    });

    const [customerStats, driverStats] = await Promise.all([
      Ride.findAll({
        where: { status: 'completed' },
        attributes: [
          'customerId',
          [Sequelize.fn('SUM', Sequelize.col('fare')), 'totalSpend'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'bookings'],
        ],
        group: ['customerId'],
        raw: true,
      }),
      Ride.findAll({
        where: { status: 'completed' },
        attributes: [
          'driverId',
          [Sequelize.fn('SUM', Sequelize.col('driverEarning')), 'earnings'],
          [Sequelize.fn('SUM', Sequelize.col('fare')), 'revenue'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'bookings'],
        ],
        group: ['driverId'],
        raw: true,
      }),
    ]);

    const statsMap = new Map<number, any>();

    (customerStats as any[]).forEach(stat => {
      statsMap.set(stat.customerId, {
        totalSpend: parseFloat(stat.totalSpend),
        bookings: parseInt(stat.bookings, 10),
      });
    });

    (driverStats as any[]).forEach(stat => {
      const existingStats = statsMap.get(stat.driverId) || {};
      statsMap.set(stat.driverId, {
        ...existingStats,
        earnings: parseFloat(stat.earnings),
        revenue: parseFloat(stat.revenue),
        driverBookings: parseInt(stat.bookings, 10),
      });
    });

    const enrichedUsers = users.map((user: any) => {
      const stats = statsMap.get(user.id) || {};
      const isDriver = user.userType === 'driver';

      return {
        ...user,
        avatar: `https://i.pravatar.cc/150?u=${user.email}`,
        revenue: isDriver ? (stats.revenue || 0) : 0,
        bookings: isDriver ? (stats.driverBookings || 0) : (stats.bookings || 0),
        totalSpend: !isDriver ? (stats.totalSpend || 0) : 0,
        earnings: isDriver ? (stats.earnings || 0) : 0,
        penalty: 0,
        signupDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
        plan: 'Standard',
        status: user.isBlocked ? 'Blocked' : 'Active',
        role: user.userType,
      };
    });

    res.status(200).json(enrichedUsers);
  } catch (error: any) {
    console.error('Error retrieving users with stats:', error);
    res.status(500).json({ error: 'Failed to retrieve users.', message: error.message });
  }
};


export const getPricing = async (req: Request, res: Response) => {
  try {
    const allRules = await PricingRule.findAll();

    const pricing = allRules.reduce((acc: any, rule: any) => {
        const category = rule.category.toLowerCase();
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(rule);
        return acc;
    }, {});

    res.status(200).json(pricing);
  } catch (error: any) {
    console.error('Error retrieving pricing rules:', error);
    res.status(500).json({ error: 'Failed to retrieve pricing.', message: error.message });
  }
};


export const getTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await SupportTicket.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'userType', 'phoneNumber', 'email', 'city', 'state']
            }],
            order: [['createdAt', 'DESC']]
        });

        const formattedTickets = tickets.map((ticket: any) => {
            const user = ticket.user;
            return {
                id: ticket.id,
                subject: ticket.subject,
                description: ticket.description,
                status: ticket.status,
                timestamp: ticket.createdAt,
                userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
                userAvatar: user ? `https://i.pravatar.cc/150?u=${user.email}` : '',
                userRole: user ? user.userType : 'N/A',
                userMobile: user ? user.phoneNumber : 'N/A',
                location: (user && user.city && user.state) ? `${user.city}, ${user.state}` : 'N/A'
            };
        });

        res.status(200).json(formattedTickets);
    } catch (error: any) {
        console.error('Error retrieving tickets:', error);
        res.status(500).json({ error: 'Failed to retrieve tickets.', message: error.message });
    }
};

export const getDriverLocations = async (req: Request, res: Response) => {
    try {
        const locations = await DriverLocation.findAll({
            include: [{
                model: User,
                as: 'driver',
                attributes: ['firstName', 'lastName', 'phoneNumber', 'currentStatus']
            }]
        });

        const formattedLocations = locations.map((loc: any) => ({
            id: loc.driverId,
            lat: loc.latitude,
            lng: loc.longitude,
            driverName: loc.driver ? `${loc.driver.firstName} ${loc.driver.lastName}` : 'N/A',
            driverPhone: loc.driver ? loc.driver.phoneNumber : 'N/A',
            status: loc.driver ? loc.driver.currentStatus : 'offline'
        }));

        res.status(200).json(formattedLocations);
    } catch (error: any) {
        console.error('Error retrieving driver locations:', error);
        res.status(500).json({ error: 'Failed to retrieve driver locations.', message: error.message });
    }
};


export const getNotificationHistory = async (req: Request, res: Response) => {
    try {
        const history = await Notification.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(history);
    } catch (error: any) {
        console.error('Error retrieving notification history:', error);
        res.status(500).json({ error: 'Failed to retrieve notification history.', message: error.message });
    }
};


// --- CONFIG --- //
export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    // There should only be one config document. Find the first one.
    const config = await Config.findOne();
    res.status(200).json(config || {}); // Return config or empty object if not found
  } catch (error: any) {
    console.error('Error retrieving system configuration:', error);
    res.status(500).json({ error: 'Failed to retrieve system configuration.', message: error.message });
  }
};

export const updateSystemConfig = async (req: Request, res: Response) => {
  const updates = req.body;
  try {
    await setConfig(updates);
    res.status(200).json({ message: 'Configuration updated successfully.' });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update configuration.', message: error.message });
  }
};

/**
 * Handles the API request to send a real-time notification from the admin panel.
 * This uses the WebSocket service for immediate delivery.
 */
export const createRealtimeNotificationHandler = async (req: Request, res: Response) => {
    const { target, title, message } = req.body;

    // Basic validation
    if (!target || !title || !message) {
        return res.status(400).json({ error: 'Request must include target, title, and message.' });
    }

    // More specific validation for the target
    const validTargets = ['all', 'drivers', 'customers'];
    if (!validTargets.includes(target) && !Array.isArray(target)) {
        return res.status(400).json({ error: 'Invalid target specified.' });
    }

    try {
        // Note: This does not save the notification to the database, it only sends it.
        await sendAdminNotification(target, { title, message });
        // Respond with 202 Accepted, as the action is handed off to the WebSocket service.
        res.status(202).json({ success: true, message: 'Notification dispatched for real-time delivery.' });
    } catch (error) {
        console.error('API Error - Failed to dispatch notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error while dispatching notification.' });
    }
};
// // lib/game-data/cards.js (adjusted to make bankruptcy more likely)
// export const cards = {
//   "coffee-shop": [
//     // OPPORTUNITY CARDS with higher risk
//     {
//       id: "opp-001",
//       type: "Opportunity",
//       question: "A popular social media influencer has offered to promote your coffee shop",
//       choiceTitle: "Hire the influencer?",
//       choices: [
//         {
//           label: "Yes",
//           description: "Pay $3,000 for a promotional campaign",
//           effects: {
//             cash: -3000,
//             revenue: 800, // Lower return on investment
//             expenses: 200, // Added ongoing expenses
//             duration: 2
//           }
//         },
//         {
//           label: "No",
//           description: "Focus on organic growth instead",
//           effects: {
//             cash: 0,
//             revenue: -200, // Opportunity cost
//             expenses: 0,
//             duration: 1
//           }
//         }
//       ]
//     },
//     {
//       id: "opp-002",
//       type: "Opportunity",
//       question: "A skilled pastry chef is looking for work",
//       choiceTitle: "Hire the premium chef?",
//       choices: [
//         {
//           label: "Hire",
//           description: "Bring on a premium chef to create signature pastries",
//           effects: {
//             cash: -1000, // Signing bonus
//             revenue: 1500,
//             expenses: 4000, // Much higher salary
//             duration: 1
//           }
//         },
//         {
//           label: "Decline",
//           description: "Stick with your current food offerings",
//           effects: {
//             cash: 0,
//             revenue: -300, // Lost opportunity
//             expenses: 0,
//             duration: 1
//           }
//         }
//       ]
//     },
//     {
//       id: "opp-003",
//       type: "Opportunity",
//       question: "A prime second location has become available in a business district",
//       choiceTitle: "Open another location?",
//       choices: [
//         {
//           label: "Open",
//           description: "Expand your coffee shop to a second location",
//           effects: {
//             cash: -20000, // Higher initial investment
//             revenue: 6000, 
//             expenses: 7500, // Much higher operating costs
//             duration: 1
//           }
//         },
//         {
//           label: "Decline",
//           description: "Focus on your current location",
//           effects: {
//             cash: 0,
//             revenue: 0,
//             expenses: 0,
//             duration: 1
//           }
//         }
//       ]
//     },
    
//     // PROBLEM CARDS with costly issues
//     {
//       id: "prob-001",
//       type: "Problem",
//       question: "All of your espresso machines have broken down!",
//       choiceTitle: "How will you handle it?",
//       choices: [
//         {
//           label: "Buy New",
//           description: "Purchase new high-end espresso machines",
//           effects: {
//             cash: -8000, // More expensive equipment
//             revenue: 500, // Small boost from better equipment
//             expenses: 200, // Higher maintenance
//             duration: 1
//           }
//         },
//         {
//           label: "Repair",
//           description: "Pay for repairs but accept reduced performance",
//           effects: {
//             cash: -3000,
//             revenue: -1200, // Significant revenue loss
//             expenses: 300, // Ongoing repair costs
//             duration: 3
//           }
//         }
//       ]
//     },
//     {
//       id: "prob-002",
//       type: "Problem",
//       question: "Multiple staff members quit simultaneously",
//       choiceTitle: "How will you respond?",
//       choices: [
//         {
//           label: "Hire Quickly",
//           description: "Pay premium wages to get staff immediately",
//           effects: {
//             cash: -1500, // Signing bonuses
//             revenue: 0,
//             expenses: 2500, // Higher wages
//             duration: 3
//           }
//         },
//         {
//           label: "Operate Short-Staffed",
//           description: "Run the shop with minimal staff while hiring slowly",
//           effects: {
//             cash: 0,
//             revenue: -2000, // Lost business due to slow service
//             expenses: -800, // Lower payroll
//             duration: 2
//           }
//         }
//       ]
//     },
//     {
//       id: "prob-003",
//       type: "Problem",
//       question: "Health inspector found serious violations in your kitchen",
//       choiceTitle: "How will you address this?",
//       choices: [
//         {
//           label: "Complete Renovation",
//           description: "Completely overhaul kitchen to exceed standards",
//           effects: {
//             cash: -12000, // Extremely expensive renovation
//             revenue: 0,
//             expenses: -200, // Small reduction in utility costs
//             duration: 1
//           }
//         },
//         {
//           label: "Minimum Fixes",
//           description: "Make only the required improvements",
//           effects: {
//             cash: -3000,
//             revenue: -1000, // Reputation damage
//             expenses: 300, // Increased maintenance
//             duration: 3
//           }
//         }
//       ]
//     },
    
//     // MARKET CARDS with significant challenges
//     {
//       id: "market-001",
//       type: "Market",
//       question: "Severe economic recession has hit the area",
//       choiceTitle: "How will you respond to the downturn?",
//       choices: [
//         {
//           label: "Cut Costs",
//           description: "Reduce expenses by cutting quality and staff",
//           effects: {
//             cash: 0,
//             revenue: -2000, // Customer loss due to lower quality
//             expenses: -3000, // Major cost reduction
//             duration: 3
//           }
//         },
//         {
//           label: "Maintain Service",
//           description: "Keep your quality high despite the recession",
//           effects: {
//             cash: 0,
//             revenue: -3000, // Fewer customers due to recession
//             expenses: 500, // Increased costs to maintain quality
//             duration: 4
//           }
//         }
//       ]
//     },
//     {
//       id: "market-002",
//       type: "Market",
//       question: "A major coffee chain has opened across the street",
//       choiceTitle: "How will you compete?",
//       choices: [
//         {
//           label: "Price War",
//           description: "Lower your prices to compete",
//           effects: {
//             cash: 0,
//             revenue: -1500, // Lower revenue per customer
//             expenses: 0,
//             duration: 3
//           }
//         },
//         {
//           label: "Premium Strategy",
//           description: "Invest in premium offerings and better service",
//           effects: {
//             cash: -5000, // Investment in training and equipment
//             revenue: -500, // Initial customer loss
//             expenses: 2000, // Higher quality ingredients
//             duration: 2
//           }
//         }
//       ]
//     },
    
//     // HAPPY CARDS (even these have risks)
//     {
//       id: "happy-001",
//       type: "Happy",
//       question: "An investor is interested in your coffee shop",
//       choiceTitle: "Accept investment offer?",
//       choices: [
//         {
//           label: "Accept",
//           description: "Take the investment but give up 40% ownership",
//           effects: {
//             cash: 18000,
//             revenue: 0,
//             expenses: 1500, // New reporting requirements
//             duration: 1
//           }
//         },
//         {
//           label: "Decline",
//           description: "Maintain full ownership of your business",
//           effects: {
//             cash: 0,
//             revenue: 0,
//             expenses: 0,
//             duration: 1
//           }
//         }
//       ]
//     },
//     {
//       id: "happy-002",
//       type: "Happy",
//       question: "A celebrity was spotted at your coffee shop!",
//       choiceTitle: "How will you leverage this?",
//       choices: [
//         {
//           label: "PR Campaign",
//           description: "Launch a marketing campaign around the visit",
//           effects: {
//             cash: -4000, // Expensive PR campaign
//             revenue: 2000, // Temporary boost
//             expenses: 500, // Ongoing PR costs
//             duration: 2
//           }
//         },
//         {
//           label: "Subtle Mention",
//           description: "Just add a small mention on social media",
//           effects: {
//             cash: 0,
//             revenue: 800,
//             expenses: 0,
//             duration: 1
//           }
//         }
//       ]
//     },
    
//     // B2B CARDS with potential traps
//     {
//       id: "b2b-001",
//       type: "Opportunity",
//       question: "A large corporation wants you to supply coffee to their office daily",
//       choiceTitle: "Accept the corporate contract?",
//       choices: [
//         {
//           label: "Accept",
//           description: "Supply their office but wait 90 days for payment",
//           effects: {
//             cash: -8000,  // Upfront costs for supplies and staff
//             revenue: 0,   // No immediate revenue
//             expenses: 2000, // Increased operating costs
//             duration: 3,
//             delayed_cash: {value: 12000, months: 3}  // Payment after 3 months
//           }
//         },
//         {
//           label: "Decline",
//           description: "Focus on regular retail customers",
//           effects: {
//             cash: 0,
//             revenue: 0,
//             expenses: 0,
//             duration: 1
//           }
//         }
//       ]
//     },
//     {
//       id: "market-003",
//       type: "Market",
//       question: "Coffee bean prices have doubled due to global shortage",
//       choiceTitle: "How will you handle the cost increase?",
//       choices: [
//         {
//           label: "Absorb Costs",
//           description: "Maintain prices but accept lower margins",
//           effects: {
//             cash: 0,
//             revenue: 0,
//             expenses: 2500, // Significantly higher ingredient costs
//             duration: 4
//           }
//         },
//         {
//           label: "Raise Prices",
//           description: "Increase your prices to maintain margins",
//           effects: {
//             cash: 0,
//             revenue: -1500, // Lost customers due to higher prices
//             expenses: 1000, // Still some increase in costs
//             duration: 3
//           }
//         }
//       ]
//     },
//     {
//       id: "prob-004",
//       type: "Problem",
//       question: "Your landlord has doubled your rent",
//       choiceTitle: "How will you respond?",
//       choices: [
//         {
//           label: "Pay New Rate",
//           description: "Accept the new rental terms",
//           effects: {
//             cash: 0,
//             revenue: 0,
//             expenses: 3500, // Dramatically higher rent
//             duration: 1
//           }
//         },
//         {
//           label: "Relocate",
//           description: "Move to a cheaper location",
//           effects: {
//             cash: -15000, // Moving costs
//             revenue: -3000, // Lost regular customers
//             expenses: -1500, // Lower rent
//             duration: 3
//           }
//         }
//       ]
//     }
//   ]
// };
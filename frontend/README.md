# Driveaway Pro

Build a modern, professional full-stack-ready frontend for a Smart Vehicle Rental & Fleet Management Platform.

Goal

Create a production-quality vehicle rental web application where customers can discover and book vehicles, vendors can manage their fleet, and admins can manage the entire platform.

Important

For this first version, focus on the frontend UI and user experience. Do not create fake backend logic or hard-code business logic. Structure the application so it can later connect to a FastAPI REST API and PostgreSQL database.

Tech

React

TypeScript

Vite

Tailwind CSS

React Router

Reusable components

Responsive design

Clean component structure

User Roles

Customer

Vendor

Admin

Customer Pages

Landing/Home

Modern hero section

Search vehicles by location and dates

Popular vehicles

Vehicle categories

How it works

Features/benefits

Customer testimonials

Call-to-action

Professional footer

Vehicle Listing

Vehicle cards with image, name, type, price/day, rating, location and availability

Search

Filters:

Vehicle type

Price range

Fuel type

Transmission

Number of seats

Location

Sorting

Pagination

Vehicle Details

Large image gallery

Vehicle specifications

Description

Features

Rating/reviews

Vendor information

Location

Rental price

Date selection

Availability

"Book Now" button

Booking

Selected vehicle summary

Pickup location

Start date/time

End date/time

Price breakdown

Rental cost

Taxes/fees

Discount

Final total

Booking confirmation

Customer Dashboard

Overview

Upcoming bookings

Active rental

Previous bookings

Saved/favorite vehicles

Payments

Reviews

Profile/settings

Vendor Pages

Create a separate vendor dashboard with:

Dashboard overview

Total vehicles

Active bookings

Upcoming bookings

Revenue

Vehicle management

Add vehicle

Edit vehicle

Vehicle availability

Booking management

Maintenance management

Earnings

Reviews

Profile/settings

Include useful charts and tables.

Admin Pages

Create a professional admin dashboard with:

Overview

Total users

Total vendors

Total vehicles

Active rentals

Total bookings

Revenue

User management

Vendor management

Vehicle management

Booking management

Payment management

Maintenance overview

Reports/analytics

Smart Features UI

Prepare frontend interfaces for these future backend features:

Vehicle Recommendation

Show "Recommended for You" vehicles

Display a match percentage such as 92%

Dynamic Pricing

Display base price, demand adjustment, discount and final price

Do not calculate the real price on the frontend; prepare the UI for API data.

Maintenance Alerts

Show maintenance status such as:

Good

Service Due Soon

Under Maintenance

Design

Use a premium, modern mobility/SaaS design.

Clean and minimal

Professional typography

Spacious layouts

High-quality vehicle imagery

Consistent cards and buttons

Subtle animations

Responsive on desktop, tablet and mobile

Accessible forms

Good empty states

Loading states

Error states

Confirmation dialogs

Avoid making it look like a generic template.

Navigation

Customer navigation:
Home | Vehicles | Bookings | Favorites | Dashboard

Vendor navigation:
Dashboard | Vehicles | Bookings | Maintenance | Earnings

Admin navigation:
Dashboard | Users | Vendors | Vehicles | Bookings | Payments | Reports

Component Requirements

Create reusable components for:

Navbar

Footer

VehicleCard

VehicleGrid

SearchBar

FilterPanel

Rating

DatePicker

PriceBreakdown

BookingCard

DashboardCard

DataTable

Sidebar

Modal

Toast/notification

Loading skeleton

Empty state

API Preparation

Create a clean API service layer so that later I can connect the frontend to FastAPI REST endpoints.

Use placeholder/mock data only for displaying the UI, but keep API calls isolated in a service layer.

Do not put API calls directly inside every component.

Expected Result

The final result should look like a real commercial vehicle rental platform rather than a college demo project.

Prioritize:

Professional UI

Good UX

Reusable React components

Responsive design

Clean folder structure

Easy future integration with FastAPI

Customer, Vendor and Admin dashboards

Production-quality visual polish

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/119cf1e5-406b-4ab8-b98e-65bc4b4a64dd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

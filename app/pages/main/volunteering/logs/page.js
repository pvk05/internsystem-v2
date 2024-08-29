
"use client"

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import authWrapper from "@/app/middleware/authWrapper";
import prismaRequest from "@/app/middleware/prisma/prismaRequest";
import CustomTable from "@/app/components/table";
import { format, parseISO } from "date-fns";
import { useSession } from "next-auth/react";
import LogInput from "./logInput";
import { PageHeader } from "@/app/components/sanity/PageBuilder";

const WORK_TABLE_HEADERS = [
  { id: "workedAt", name: "work date", sortBy: "workedAt_num", flex: 2 },
  { id: "duration", name: "duration", flex: 1 },
  { id: "description", name: "description", flex: 3 },
  { id: "loggedBy", name: "log by", flex: 2 },
  { id: "loggedFor", name: "log for", flex: 2 },
];

const VOUCHER_TABLE_HEADERS = [
  { id: "usedAt", name: "usage date", sortBy: "usedAt_num", flex: 2 },
  { id: "amount", name: "vouchers", flex: 2 },
  { id: "description", name: "description", flex: 4 },
  { id: "loggedFor", name: "log for", flex: 2 },
];

function LogsPage() {
  
  const [users, setUsers] = useState([]);
  const [workGroups, setWorkGroups] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [voucherLogs, setVoucherLogs] = useState([]);
  
  const [mode, setMode] = useState(true);
  const [vouchersEarned, setVouchersEarned] = useState(0)
  const [vouchersUsed, setVouchersUsed] = useState(0);
  
  
  const [refresh, setRefresh] = useState(false);
  
  const session = useSession();
  
  useEffect(() => {
    
    prismaRequest({
      model: "user",
      method: "find",
      request: {
        where: {
          active: true
        }
      },
      callback: (data) => {
        if (data.data.length != 0) {
          // console.log(data);
          setUsers(
            data.data.map((e) => {
              return { ...e, name: `${e.firstName} ${e.lastName}`}
            })
          )
        } 
      }
    });
    
    prismaRequest({
      model: "workGroup",
      method: "find",
      callback: (data) => setWorkGroups(data.data),
    });
    
  }, [])
  
  useEffect(() => {
  
    prismaRequest({
      model: "workLog",
      method: "find",
      request: {
        include: {
          LoggedByUser: true,
          LoggedForUser: true,
        },
        where: {
          semesterId: session.data.semester.id,
        },
      },
      callback: (data) => {
        if (data.length == 0) return;
        console.log(data.data);

        const newLogs = data.data.map((e) => {
          const p1 = e.LoggedByUser;
          const p2 = e.LoggedForUser;
          const p1name = p1 ? `${p1.firstName} ${p1.lastName}` : null
          const p2name = p2 ? `${p2.firstName} ${p2.lastName}` : null;
          return {
            ...e,
            loggedBy: p1name,
            loggedFor: p2name,
            vouchers: e.duration * 0.5,
            workedAt_num: parseISO(e.workedAt).getTime(),
            workedAt: format(
              parseISO(e.workedAt),
              "dd.MM HH:mm"
            ).toLowerCase(),
          };
        });

        const newVouchers = data.data
          .filter((e) => {
            const person = e.LoggedForUser;
            return person && person.id == session.data.user.id;
          })
          .reduce((total, e) => {
            return (total += e.duration * 0.5);
          }, 0.0);

        setWorkLogs(newLogs);
        setVouchersEarned(parseFloat(newVouchers));
      },
    });
    
  }, [refresh])
  
  useEffect(() => {
    
    prismaRequest({
      model: "voucherLog",
      method: "find",
      request: {
        include: {
          User: true,
        },
        where: {
          semesterId: session.data.semester.id,
        }
      },
      callback: (data) => {
        if (data.length == 0) return;

        const newVouchers = data.data
          .filter((e) => {
            const person = e.User;
            const personId = person.id;
            return personId == session.data.user.id;
          })
          .reduce((total, e) => {
            return (total += e.amount);
          }, 0.0);
        
        const newLogs = data.data.map((e) => {
          return {
            ...e,
            loggedFor: `${e.User.firstName} ${e.User.lastName}`,
            usedAt_num: parseISO(e.usedAt).getTime(),
            usedAt: format(
              parseISO(e.usedAt),
              "dd MMM 'kl.'HH:mm"
            ).toLowerCase(),
          };
        })

        setVouchersUsed(parseFloat(newVouchers));
        setVoucherLogs(newLogs)
      },
    });
    
  }, [refresh])
  
  const layout = LogInput(
    session,
    users,
    workGroups,
    vouchersEarned,
    vouchersUsed,
    mode,
    setRefresh
  );
  
  if (session.status != "authenticated") {
    return;
  }
  
  return (
    <Box>
      {/* <PageHeader text={mode ? "Work logs" : "Voucher logs"} /> */}
      <PageHeader text="Logs" />

      <Grid container spacing={2}>
        <Grid item md={4} xs={12} alignContent="start">
          <Card elevation={3}>
            <CardContent>
              <Stack
                direction="row"
                spacing={1}
                pb={4}
                sx={{ display: { xs: "flex", lg: "none" } }}
              >
                <Button
                  fullWidth
                  variant={mode ? "contained" : "outlined"}
                  onClick={() => setMode(true)}
                >
                  Register
                </Button>
                <Button
                  fullWidth
                  variant={!mode ? "contained" : "outlined"}
                  onClick={() => setMode(false)}
                >
                  Use
                </Button>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                pb={4}
                sx={{ display: { xs: "none", lg: "flex" } }}
              >
                <Button
                  fullWidth
                  variant={mode ? "contained" : "outlined"}
                  onClick={() => setMode(true)}
                >
                  Register work
                </Button>
                <Button
                  fullWidth
                  variant={!mode ? "contained" : "outlined"}
                  onClick={() => setMode(false)}
                >
                  Use voucher
                </Button>
              </Stack>

              {layout}
            </CardContent>
          </Card>
        </Grid>

        <Grid item md={8} xs={12}>
          {/* <Typography variant="h6" gutterBottom>
            {mode ? "Work logs" : "Voucher logs"}
          </Typography> */}
          {mode ? (
            <CustomTable
              headers={WORK_TABLE_HEADERS}
              data={workLogs}
              sortBy={"workedAt"}
            />
          ) : (
            <CustomTable
              headers={VOUCHER_TABLE_HEADERS}
              data={voucherLogs}
              sortBy={"usedAt"}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
  
}

export default authWrapper(LogsPage)
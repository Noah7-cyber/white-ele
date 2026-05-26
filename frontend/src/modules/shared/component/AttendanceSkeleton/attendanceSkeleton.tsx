import { Box, Skeleton, Paper } from "@mui/material";
import Grid from "@mui/material/Grid";

export function AttendanceSkeleton() {
  return (
    <Box width="100%">
      {/* Top Section Skeleton */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: "#fff",
        }}
      >
        <Grid container spacing={4}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Box>
                <Skeleton width={80} height={20} />
                <Skeleton width={120} height={28} sx={{ mt: 1 }} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Cards Section Skeleton */}
      <Grid container spacing={3} mt={1}>
        {[1, 2, 3, 4, 5].map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={item}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                minHeight: 120,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Skeleton width={140} height={22} />
              <Skeleton width={40} height={26} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
